from app.db import get_db_connection

def _format_notification(n):
    if n is None:
        return n
    if n.get('sent_at') is not None:
        n['sent_at'] = str(n['sent_at'])
    if n.get('is_read') is not None:
        n['is_read'] = bool(n['is_read'])
    return n

def get_all_notifications():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT n.*, m.first_name, m.last_name
        FROM notifications n
        LEFT JOIN members m ON n.member_id = m.member_id
        ORDER BY n.sent_at DESC
    """)
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_notification(n) for n in records]

def get_notifications_by_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM notifications WHERE member_id = %s ORDER BY sent_at DESC
    """, (member_id,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_notification(n) for n in records]

def create_notification(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO notifications (member_id, message, type)
        VALUES (%s, %s, %s)
    """, (
        data.get('member_id'),
        data.get('message'),
        data.get('type', 'General')
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def mark_as_read(notification_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE notifications SET is_read = TRUE WHERE notification_id = %s
    """, (notification_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def delete_notification(notification_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notifications WHERE notification_id=%s", (notification_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected