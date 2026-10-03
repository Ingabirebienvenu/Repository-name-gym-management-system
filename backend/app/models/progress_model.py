from app.db import get_db_connection

def get_progress(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
        FROM progress_logs p
        LEFT JOIN trainers t ON p.trainer_id = t.trainer_id
        WHERE p.member_id = %s
        ORDER BY p.log_date DESC, p.progress_id DESC
    """, (member_id,))
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    for l in logs:
        l['log_date'] = str(l['log_date'])
        if l.get('weight_kg') is not None:
            l['weight_kg'] = float(l['weight_kg'])
        if l.get('body_fat_percent') is not None:
            l['body_fat_percent'] = float(l['body_fat_percent'])
    return logs

def add_progress(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO progress_logs (member_id, trainer_id, log_date, weight_kg, body_fat_percent, notes)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        data.get('member_id'),
        data.get('trainer_id'),
        data.get('log_date'),
        data.get('weight_kg') or None,
        data.get('body_fat_percent') or None,
        data.get('notes'),
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def delete_progress(progress_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM progress_logs WHERE progress_id=%s", (progress_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected