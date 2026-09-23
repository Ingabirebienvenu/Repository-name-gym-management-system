from app.db import get_db_connection
from datetime import date, timedelta

def _format_payment(p):
    if p is None:
        return p
    for field in ('payment_date', 'membership_start_date', 'membership_end_date'):
        if p.get(field) is not None:
            p[field] = str(p[field])
    if p.get('amount') is not None:
        p['amount'] = float(p['amount'])
    return p

def get_all_payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, m.first_name AS member_first_name, m.last_name AS member_last_name, m.email AS member_email
        FROM payments p
        LEFT JOIN members m ON p.member_id = m.member_id
        ORDER BY p.payment_id DESC
    """)
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_payment(p) for p in payments]

def get_payment_by_id(payment_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, m.first_name AS member_first_name, m.last_name AS member_last_name, m.email AS member_email
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
    cursor.execute("SELECT * FROM payments WHERE member_id = %s ORDER BY payment_id DESC", (member_id,))
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_payment(p) for p in payments]

def count_pending_payments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM payments WHERE status = 'Pending'")
    count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return count

def create_payment(data, status='Paid'):
    """Used by admin to record a payment directly (defaults to Paid)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO payments (member_id, amount, payment_method, payment_reference, for_period, duration_months, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        data.get('member_id'),
        data.get('amount'),
        data.get('payment_method', 'Cash'),
        data.get('payment_reference'),
        data.get('for_period'),
        data.get('duration_months', 1),
        status
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def submit_payment(data):
    """Used by a member submitting their own payment. Always starts as Pending."""
    return create_payment(data, status='Pending')

def validate_payment(payment_id):
    """
    Admin approves a pending payment:
    - computes start/end dates (extends from member's current end date if still active, else from today)
    - updates the payment row and the member's row
    Returns the full payment record (with member info) on success, or None if not found/not pending.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM payments WHERE payment_id = %s", (payment_id,))
    payment = cursor.fetchone()
    if not payment or payment['status'] != 'Pending':
        cursor.close()
        conn.close()
        return None

    cursor.execute("SELECT membership_end_date FROM members WHERE member_id = %s", (payment['member_id'],))
    member_row = cursor.fetchone()
    current_end = member_row['membership_end_date'] if member_row else None

    today = date.today()
    start_date = current_end if (current_end and current_end > today) else today
    duration_months = payment.get('duration_months') or 1
    end_date = start_date + timedelta(days=30 * duration_months)

    cursor.execute("""
        UPDATE payments SET status='Paid', membership_start_date=%s, membership_end_date=%s
        WHERE payment_id=%s
    """, (start_date, end_date, payment_id))

    cursor.execute("""
        UPDATE members SET membership_status='Active', membership_start_date=%s, membership_end_date=%s
        WHERE member_id=%s
    """, (start_date, end_date, payment['member_id']))

    conn.commit()
    cursor.close()
    conn.close()

    return get_payment_by_id(payment_id)

def reject_payment(payment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE payments SET status='Failed' WHERE payment_id=%s AND status='Pending'", (payment_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    if affected == 0:
        return None
    return get_payment_by_id(payment_id)

def delete_payment(payment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM payments WHERE payment_id=%s", (payment_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected