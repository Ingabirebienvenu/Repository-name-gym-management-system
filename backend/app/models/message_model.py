from app.db import get_db_connection

def get_trainer_members(trainer_id):
    """Distinct members who have booked into this trainer's classes."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT DISTINCT m.member_id, m.first_name, m.last_name, m.email, m.phone
        FROM class_bookings cb
        JOIN classes c ON cb.class_id = c.class_id
        JOIN members m ON cb.member_id = m.member_id
        WHERE c.trainer_id = %s AND cb.status IN ('Booked', 'Attended')
        ORDER BY m.first_name
    """, (trainer_id,))
    members = cursor.fetchall()
    cursor.close()
    conn.close()
    return members

def get_unread_counts_for_trainer(trainer_id):
    """Returns {member_id: unread_count} for messages the trainer hasn't read."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT member_id, COUNT(*) AS count
        FROM messages
        WHERE trainer_id = %s AND sender = 'member' AND is_read = FALSE
        GROUP BY member_id
    """, (trainer_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return {r['member_id']: r['count'] for r in rows}

def get_conversation(trainer_id, member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM messages
        WHERE trainer_id = %s AND member_id = %s
        ORDER BY sent_at ASC
    """, (trainer_id, member_id))
    messages = cursor.fetchall()
    cursor.close()
    conn.close()
    for m in messages:
        m['sent_at'] = str(m['sent_at'])
    return messages

def send_message(trainer_id, member_id, sender, message):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO messages (trainer_id, member_id, sender, message)
        VALUES (%s, %s, %s, %s)
    """, (trainer_id, member_id, sender, message))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def mark_conversation_read(trainer_id, member_id, reader):
    """reader = 'trainer' marks member-sent messages as read, and vice versa."""
    other_sender = 'member' if reader == 'trainer' else 'trainer'
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE messages SET is_read = TRUE
        WHERE trainer_id = %s AND member_id = %s AND sender = %s
    """, (trainer_id, member_id, other_sender))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected