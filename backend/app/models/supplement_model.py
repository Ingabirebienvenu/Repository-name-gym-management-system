from app.db import get_db_connection

def get_suggestions(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.*, t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
        FROM supplement_suggestions s
        LEFT JOIN trainers t ON s.trainer_id = t.trainer_id
        WHERE s.member_id = %s
        ORDER BY s.suggested_at DESC
    """, (member_id,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    for r in rows:
        r['suggested_at'] = str(r['suggested_at'])
    return rows

def add_suggestion(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO supplement_suggestions (member_id, trainer_id, supplement_name, dosage, notes)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        data.get('member_id'),
        data.get('trainer_id'),
        data.get('supplement_name'),
        data.get('dosage'),
        data.get('notes'),
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def delete_suggestion(suggestion_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM supplement_suggestions WHERE suggestion_id=%s", (suggestion_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected