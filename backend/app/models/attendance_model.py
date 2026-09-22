from app.db import get_db_connection
from datetime import datetime

def _format_attendance(a):
    if a is None:
        return a
    if a.get('check_in_time') is not None:
        a['check_in_time'] = str(a['check_in_time'])
    if a.get('check_out_time') is not None:
        a['check_out_time'] = str(a['check_out_time'])
    return a

def get_all_attendance():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.*, m.first_name, m.last_name
        FROM attendance a
        LEFT JOIN members m ON a.member_id = m.member_id
        ORDER BY a.check_in_time DESC
    """)
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_attendance(a) for a in records]

def get_attendance_by_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT * FROM attendance WHERE member_id = %s ORDER BY check_in_time DESC
    """, (member_id,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_attendance(a) for a in records]

def check_in(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO attendance (member_id, check_in_time) VALUES (%s, %s)
    """, (member_id, datetime.now()))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def check_out(attendance_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE attendance SET check_out_time = %s WHERE attendance_id = %s
    """, (datetime.now(), attendance_id))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def delete_attendance(attendance_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM attendance WHERE attendance_id=%s", (attendance_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected