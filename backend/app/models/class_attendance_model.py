from app.db import get_db_connection

VALID_STATUSES = ('Present', 'Late', 'Absent')


def _fmt(row):
    for key in ('session_date', 'marked_at', 'start_time', 'end_time'):
        if row.get(key) is not None:
            row[key] = str(row[key])
    return row


def get_class_basic(class_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT class_id, class_name, trainer_id, schedule_day FROM classes WHERE class_id = %s", (class_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row


def get_session_roster(class_id, session_date):
    """Members booked into the class, with the status already recorded for that date (or NULL)."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT m.member_id, m.first_name, m.last_name, ca.status
        FROM class_bookings cb
        JOIN members m ON cb.member_id = m.member_id
        LEFT JOIN class_attendance ca
               ON ca.class_id = cb.class_id AND ca.member_id = m.member_id AND ca.session_date = %s
        WHERE cb.class_id = %s AND cb.status IN ('Booked', 'Attended')
        ORDER BY m.first_name, m.last_name
    """, (session_date, class_id))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


def save_session_attendance(class_id, session_date, trainer_id, records):
    """Insert or update one row per member for this class and date."""
    conn = get_db_connection()
    cursor = conn.cursor()
    saved = 0
    for r in records:
        cursor.execute("""
            INSERT INTO class_attendance (class_id, member_id, session_date, status, marked_by)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by),
                                    marked_at = CURRENT_TIMESTAMP
        """, (class_id, r['member_id'], session_date, r['status'], trainer_id))
        if r['status'] in ('Present', 'Late'):
            # keep the booking list consistent: this booking has now been attended
            cursor.execute("""
                UPDATE class_bookings SET status = 'Attended'
                WHERE class_id = %s AND member_id = %s AND status = 'Booked'
            """, (class_id, r['member_id']))
        saved += 1
    conn.commit()
    cursor.close()
    conn.close()
    return saved


def get_member_attendance(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT ca.attendance_id, ca.session_date, ca.status, ca.marked_at,
               c.class_id, c.class_name, c.schedule_day, c.start_time, c.end_time,
               t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
        FROM class_attendance ca
        JOIN classes c ON ca.class_id = c.class_id
        LEFT JOIN trainers t ON ca.marked_by = t.trainer_id
        WHERE ca.member_id = %s
        ORDER BY ca.session_date DESC, ca.attendance_id DESC
    """, (member_id,))
    rows = [_fmt(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return rows


def get_class_attendance(class_id=None, date_from=None, date_to=None, status=None, limit=500):
    """Admin view: every class attendance record, filterable."""
    where, params = [], []
    if class_id:
        where.append("ca.class_id = %s"); params.append(class_id)
    if date_from:
        where.append("ca.session_date >= %s"); params.append(date_from)
    if date_to:
        where.append("ca.session_date <= %s"); params.append(date_to)
    if status in VALID_STATUSES:
        where.append("ca.status = %s"); params.append(status)
    where_sql = ("WHERE " + " AND ".join(where)) if where else ""

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"""
        SELECT ca.attendance_id, ca.session_date, ca.status, ca.marked_at,
               m.member_id, m.first_name, m.last_name,
               c.class_id, c.class_name, c.schedule_day,
               t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
        FROM class_attendance ca
        JOIN members m ON ca.member_id = m.member_id
        JOIN classes c ON ca.class_id = c.class_id
        LEFT JOIN trainers t ON ca.marked_by = t.trainer_id
        {where_sql}
        ORDER BY ca.session_date DESC, c.class_name, m.first_name
        LIMIT %s
    """, (*params, int(limit)))
    rows = [_fmt(r) for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return rows