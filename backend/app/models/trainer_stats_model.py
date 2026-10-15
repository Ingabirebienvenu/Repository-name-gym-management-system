from datetime import date, timedelta
from app.db import get_db_connection

DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
DAY_SHORT = {d: d[:3] for d in DAY_ORDER}
WEEKS = 8


def _monday(d):
    return d - timedelta(days=d.weekday())


def get_trainer_stats(trainer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # ---- classes with active booking counts ---------------------------------
    cursor.execute("""
        SELECT c.class_id, c.class_name, c.schedule_day, c.start_time, c.end_time, c.capacity,
               COUNT(CASE WHEN cb.status IN ('Booked', 'Attended') THEN 1 END) AS booked
        FROM classes c
        LEFT JOIN class_bookings cb ON cb.class_id = c.class_id
        WHERE c.trainer_id = %s
        GROUP BY c.class_id, c.class_name, c.schedule_day, c.start_time, c.end_time, c.capacity
        ORDER BY c.class_name
    """, (trainer_id,))
    classes = cursor.fetchall()
    for c in classes:
        c['start_time'] = str(c['start_time'])
        c['end_time'] = str(c['end_time'])
        c['capacity'] = int(c['capacity'] or 0)
        c['booked'] = int(c['booked'] or 0)
        c['fill_pct'] = round(c['booked'] * 100 / c['capacity']) if c['capacity'] else 0

    total_capacity = sum(c['capacity'] for c in classes)
    total_booked = sum(c['booked'] for c in classes)
    fill_rate = round(total_booked * 100 / total_capacity) if total_capacity else 0

    # ---- distinct members + attendance rate ---------------------------------
    cursor.execute("""
        SELECT COUNT(DISTINCT cb.member_id) AS members,
               SUM(cb.status = 'Attended') AS attended,
               SUM(cb.status IN ('Booked', 'Attended')) AS active
        FROM class_bookings cb
        JOIN classes c ON cb.class_id = c.class_id
        WHERE c.trainer_id = %s
    """, (trainer_id,))
    row = cursor.fetchone()
    members = int(row['members'] or 0)
    attended = int(row['attended'] or 0)
    active = int(row['active'] or 0)
    attendance_rate = round(attended * 100 / active) if active else 0

    # ---- unread messages ------------------------------------------------------
    cursor.execute("""
        SELECT COUNT(*) AS n FROM messages
        WHERE trainer_id = %s AND sender = 'member' AND is_read = FALSE
    """, (trainer_id,))
    unread = int(cursor.fetchone()['n'])

    # ---- coaching activity in the last 30 days -------------------------------
    since_30 = date.today() - timedelta(days=30)
    cursor.execute(
        "SELECT COUNT(*) AS n FROM progress_logs WHERE trainer_id = %s AND log_date >= %s",
        (trainer_id, since_30))
    progress_30 = int(cursor.fetchone()['n'])
    cursor.execute(
        "SELECT COUNT(*) AS n FROM supplement_suggestions WHERE trainer_id = %s AND suggested_at >= %s",
        (trainer_id, since_30))
    supplements_30 = int(cursor.fetchone()['n'])

    # ---- bookings per weekday --------------------------------------------------
    by_day = {d: 0 for d in DAY_ORDER}
    for c in classes:
        if c['schedule_day'] in by_day:
            by_day[c['schedule_day']] += c['booked']
    bookings_by_day = [{'day': DAY_SHORT[d], 'full_day': d, 'bookings': by_day[d]} for d in DAY_ORDER]

    # ---- weekly activity (last 8 weeks) ----------------------------------------
    this_monday = _monday(date.today())
    first_monday = this_monday - timedelta(weeks=WEEKS - 1)

    cursor.execute("""
        SELECT DATE_SUB(cb.booking_date, INTERVAL WEEKDAY(cb.booking_date) DAY) AS wk, COUNT(*) AS n
        FROM class_bookings cb
        JOIN classes c ON cb.class_id = c.class_id
        WHERE c.trainer_id = %s AND cb.booking_date >= %s AND cb.status <> 'Cancelled'
        GROUP BY wk
    """, (trainer_id, first_monday))
    booking_weeks = {r['wk']: int(r['n']) for r in cursor.fetchall()}

    cursor.execute("""
        SELECT DATE_SUB(log_date, INTERVAL WEEKDAY(log_date) DAY) AS wk, COUNT(*) AS n
        FROM progress_logs
        WHERE trainer_id = %s AND log_date >= %s
        GROUP BY wk
    """, (trainer_id, first_monday))
    progress_weeks = {r['wk']: int(r['n']) for r in cursor.fetchall()}

    weekly_activity = []
    for i in range(WEEKS):
        wk = first_monday + timedelta(weeks=i)
        weekly_activity.append({
            'week': wk.strftime('%d %b').lstrip('0'),
            'bookings': booking_weeks.get(wk, 0),
            'progress': progress_weeks.get(wk, 0),
        })

    # ---- members with no recent progress entry ---------------------------------
    cursor.execute("""
        SELECT m.member_id, m.first_name, m.last_name, MAX(p.log_date) AS last_log
        FROM class_bookings cb
        JOIN classes c ON cb.class_id = c.class_id
        JOIN members m ON cb.member_id = m.member_id
        LEFT JOIN progress_logs p ON p.member_id = m.member_id AND p.trainer_id = c.trainer_id
        WHERE c.trainer_id = %s AND cb.status IN ('Booked', 'Attended')
        GROUP BY m.member_id, m.first_name, m.last_name
        HAVING last_log IS NULL OR last_log < %s
        ORDER BY (last_log IS NULL) DESC, last_log ASC
        LIMIT 6
    """, (trainer_id, since_30))
    needs_attention = cursor.fetchall()
    for m in needs_attention:
        if m['last_log'] is not None:
            m['days_since'] = (date.today() - m['last_log']).days
            m['last_log'] = str(m['last_log'])
        else:
            m['days_since'] = None

    cursor.close()
    conn.close()

    return {
        'totals': {
            'classes': len(classes),
            'members': members,
            'active_bookings': active,
            'fill_rate': fill_rate,
            'attendance_rate': attendance_rate,
            'unread_messages': unread,
            'progress_30d': progress_30,
            'supplements_30d': supplements_30,
        },
        'classes': classes,
        'bookings_by_day': bookings_by_day,
        'weekly_activity': weekly_activity,
        'needs_attention': needs_attention,
    }