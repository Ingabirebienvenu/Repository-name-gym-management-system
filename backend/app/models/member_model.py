from app.db import get_db_connection

# Explicit column list: the password hash must never be sent to the browser.
MEMBER_COLUMNS = (
    "member_id, first_name, last_name, email, phone, date_of_birth, "
    "membership_type, join_date, membership_status, "
    "membership_start_date, membership_end_date, created_at"
)

DATE_FIELDS = (
    'date_of_birth', 'join_date',
    'membership_start_date', 'membership_end_date', 'created_at'
)


def _format_member(m):
    """Dates come back as date objects; turn them into 'YYYY-MM-DD' strings."""
    if m is None:
        return m
    for field in DATE_FIELDS:
        if m.get(field) is not None:
            m[field] = str(m[field])
    return m


def get_all_members():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT {MEMBER_COLUMNS} FROM members")
    members = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_member(m) for m in members]


def get_member_by_id(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(f"SELECT {MEMBER_COLUMNS} FROM members WHERE member_id = %s", (member_id,))
    member = cursor.fetchone()
    cursor.close()
    conn.close()
    return _format_member(member)


def create_member(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO members (first_name, last_name, email, phone, date_of_birth, membership_type)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        data.get('first_name'),
        data.get('last_name'),
        data.get('email'),
        data.get('phone'),
        data.get('date_of_birth') or None,
        data.get('membership_type', 'Basic')
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id


def update_member(member_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE members
        SET first_name=%s, last_name=%s, email=%s, phone=%s, date_of_birth=%s, membership_type=%s, membership_status=%s
        WHERE member_id=%s
    """, (
        data.get('first_name'),
        data.get('last_name'),
        data.get('email'),
        data.get('phone'),
        data.get('date_of_birth') or None,
        data.get('membership_type'),
        data.get('membership_status'),
        member_id
    ))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected


def delete_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM members WHERE member_id=%s", (member_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected