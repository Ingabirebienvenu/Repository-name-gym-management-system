from app.db import get_db_connection

def get_revenue_by_month(months=6):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT DATE_FORMAT(payment_date, '%%Y-%%m') AS month, SUM(amount) AS total
        FROM payments
        WHERE status = 'Paid' AND payment_date >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        GROUP BY month
        ORDER BY month
    """, (months,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"month": r['month'], "total": float(r['total'] or 0)} for r in rows]

def get_members_by_type():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT membership_type, COUNT(*) AS count FROM members GROUP BY membership_type")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

def get_payments_by_method():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT payment_method, COUNT(*) AS count, SUM(amount) AS total
        FROM payments WHERE status = 'Paid'
        GROUP BY payment_method
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"payment_method": r['payment_method'], "count": r['count'], "total": float(r['total'] or 0)} for r in rows]

def get_attendance_last_7_days():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT DATE(check_in_time) AS day, COUNT(*) AS count
        FROM attendance
        WHERE check_in_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY day
        ORDER BY day
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [{"day": str(r['day']), "count": r['count']} for r in rows]