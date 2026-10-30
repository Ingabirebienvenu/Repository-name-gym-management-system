"""
One place that tells a member about something: it saves an in-app notification
AND sends an email. Emails are sent in a background thread so the admin /
trainer never waits for Gmail.
"""
import threading

from app.db import get_db_connection
from app.models.notification_model import create_notification
from app.utils.email_helper import send_email
from app.utils.email_templates import build_email


def _background(fn, *args, **kwargs):
    threading.Thread(target=fn, args=args, kwargs=kwargs, daemon=True).start()


def _member_contact(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT first_name, email FROM members WHERE member_id = %s", (member_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row


def trainer_name(trainer_id):
    if not trainer_id:
        return "Your trainer"
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT first_name, last_name FROM trainers WHERE trainer_id = %s", (trainer_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return f"{row['first_name']} {row['last_name']}" if row else "Your trainer"


def _send(member_id, subject, heading, intro, rows, closing, short_message, notif_type, in_app):
    try:
        member = _member_contact(member_id)
        if not member:
            print(f"[email] {subject} -> member {member_id} not found, nothing sent")
            return
        if in_app and short_message:
            create_notification({
                "member_id": member_id,
                "message": short_message[:250],
                "type": notif_type,
            })
        if member.get("email"):
            intro_text = f"Hi {member['first_name']}, {intro}"
            ok = send_email(member["email"], subject, build_email(heading, intro_text, rows, closing))
            print(f"[email] {subject} -> {member['email']} : {'SENT' if ok else 'FAILED'}")
        else:
            print(f"[email] {subject} -> member {member_id} has no email address, nothing sent")
    except Exception as e:  # never let a notification break the real request
        print(f"Notification failed for member {member_id}: {e}")


def notify_member(member_id, subject, heading, intro, rows=None, closing=None,
                  short_message=None, notif_type="General", in_app=True):
    """Fire-and-forget: in-app notification + email for one member."""
    _background(_send, member_id, subject, heading, intro, rows, closing,
                short_message, notif_type, in_app)


def _broadcast(member_ids, subject, heading, intro, rows, closing, short_message, notif_type):
    for mid in member_ids:
        _send(mid, subject, heading, intro, rows, closing, short_message, notif_type, True)


def notify_members(member_ids, subject, heading, intro, rows=None, closing=None,
                   short_message=None, notif_type="General"):
    """Same message to many members, sent from a single background thread."""
    _background(_broadcast, list(member_ids), subject, heading, intro, rows,
                closing, short_message, notif_type)


def all_member_ids():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT member_id FROM members")
    ids = [r[0] for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return ids


def booked_member_ids(class_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT DISTINCT member_id FROM class_bookings WHERE class_id = %s AND status = 'Booked'",
        (class_id,),
    )
    ids = [r[0] for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return ids


def unread_trainer_messages(trainer_id, member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM messages WHERE trainer_id=%s AND member_id=%s "
        "AND sender='trainer' AND is_read=FALSE",
        (trainer_id, member_id),
    )
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count