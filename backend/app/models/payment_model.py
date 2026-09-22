from app.db import get_db_connection

def _format_payment(p):
    """Convert non-JSON-serializable fields to strings."""
    if p is None:
        return p
    if p.get('payment_date') is not None:
        p['payment_date'] = str(p['payment_date'])
    if p.get('amount') is not None:
        p['amount'] = float(p['amount'])
    return p

def get_all_payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, m.first_name AS member_first_name, m.last_name AS member_last_name
        FROM payments p
        LEFT JOIN members m ON p.member_id = m.member_id
    """)
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_payment(p) for p in payments]

def get_payment_by_id(payment_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, m.first_name AS member_first_name, m.last_name AS member_last_name
        FROM payments p
        LEFT JOIN members m ON p.member_id = m.member_id
        WHERE p.payment_id = %s
    """, (payment_id,))
    payment = cursor.fetchone()
    cursor.close()
    conn.close()
    return _format_payment(payment)

def get_payments_by_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM payments WHERE member_id = %s", (member_id,))
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_payment(p) for p in payments]

def create_payment(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO payments (member_id, amount, payment_method, for_period, status)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        data.get('member_id'),
        data.get('amount'),
        data.get('payment_method', 'Cash'),
        data.get('for_period'),
        data.get('status', 'Paid')
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def update_payment(payment_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE payments
        SET amount=%s, payment_method=%s, for_period=%s, status=%s
        WHERE payment_id=%s
    """, (
        data.get('amount'),
        data.get('payment_method'),
        data.get('for_period'),
        data.get('status'),
        payment_id
    ))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def delete_payment(payment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM payments WHERE payment_id=%s", (payment_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected