from app.db import get_db_connection
from app.utils.security import hash_password, verify_password

PROFILE_COLUMNS = (
    "member_id, first_name, last_name, email, phone, date_of_birth, "
    "membership_type, membership_status, join_date, "
    "membership_start_date, membership_end_date"
)
DATE_FIELDS = ('date_of_birth', 'join_date', 'membership_start_date', 'membership_end_date')


def _fmt(row):
    if row:
        for f in DATE_FIELDS:
            if row.get(f) is not None:
                row[f] = str(row[f])
    return row


def get_profile(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT {PROFILE_COLUMNS} FROM members WHERE member_id = %s", (member_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return _fmt(row)


def email_in_use(email, member_id):
    """True if another member, a trainer or an admin already uses this email."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM members WHERE email = %s AND member_id <> %s", (email, member_id))
    taken = cursor.fetchone() is not None
    if not taken:
        cursor.execute("SELECT 1 FROM trainers WHERE email = %s", (email,))
        taken = cursor.fetchone() is not None
    if not taken:
        cursor.execute("SELECT 1 FROM admins WHERE email = %s", (email,))
        taken = cursor.fetchone() is not None
    cursor.close()
    conn.close()
    return taken


def update_profile(member_id, data):
    """Only personal details. Membership type/status are NOT editable here."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE members
        SET first_name = %s, last_name = %s, email = %s, phone = %s, date_of_birth = %s
        WHERE member_id = %s
    """, (data['first_name'], data['last_name'], data['email'],
          data.get('phone') or None, data.get('date_of_birth') or None, member_id))
    conn.commit()
    cursor.close()
    conn.close()


def change_password(member_id, current_password, new_password):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT password FROM members WHERE member_id = %s", (member_id,))
    row = cursor.fetchone()
    if not row or not row['password'] or not verify_password(current_password, row['password']):
        cursor.close()
        conn.close()
        return False
    cursor.execute("UPDATE members SET password = %s WHERE member_id = %s",
                   (hash_password(new_password), member_id))
    conn.commit()
    cursor.close()
    conn.close()
    return True