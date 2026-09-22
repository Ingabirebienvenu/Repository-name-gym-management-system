from app.db import get_db_connection

def _format_booking(b):
    if b is None:
        return b
    if b.get('booking_date') is not None:
        b['booking_date'] = str(b['booking_date'])
    if b.get('start_time') is not None:
        b['start_time'] = str(b['start_time'])
    if b.get('end_time') is not None:
        b['end_time'] = str(b['end_time'])
    return b

def get_all_bookings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.*, m.first_name AS member_first_name, m.last_name AS member_last_name,
               c.class_name, c.schedule_day, c.start_time, c.end_time
        FROM class_bookings b
        LEFT JOIN members m ON b.member_id = m.member_id
        LEFT JOIN classes c ON b.class_id = c.class_id
        ORDER BY b.booking_date DESC
    """)
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_booking(b) for b in records]

def get_bookings_by_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.*, c.class_name, c.schedule_day, c.start_time, c.end_time
        FROM class_bookings b
        LEFT JOIN classes c ON b.class_id = c.class_id
        WHERE b.member_id = %s
    """, (member_id,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_booking(b) for b in records]

def get_bookings_by_class(class_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT b.*, m.first_name AS member_first_name, m.last_name AS member_last_name
        FROM class_bookings b
        LEFT JOIN members m ON b.member_id = m.member_id
        WHERE b.class_id = %s AND b.status = 'Booked'
    """, (class_id,))
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_booking(b) for b in records]

def _get_class_capacity_info(cursor, class_id):
    """Returns (capacity, current_booked_count) for a class."""
    cursor.execute("SELECT capacity FROM classes WHERE class_id = %s", (class_id,))
    row = cursor.fetchone()
    if row is None:
        return None, None
    capacity = row[0]
    cursor.execute(
        "SELECT COUNT(*) FROM class_bookings WHERE class_id = %s AND status = 'Booked'",
        (class_id,)
    )
    booked_count = cursor.fetchone()[0]
    return capacity, booked_count

def create_booking(data):
    """
    Returns a dict: {"success": bool, "error": str or None, "booking_id": int or None}
    """
    member_id = data.get('member_id')
    class_id = data.get('class_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check the class exists and has room
    capacity, booked_count = _get_class_capacity_info(cursor, class_id)
    if capacity is None:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Class not found", "booking_id": None}

    if booked_count >= capacity:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Class is full", "booking_id": None}

    # Check the member isn't already booked into this same class
    cursor.execute(
        "SELECT COUNT(*) FROM class_bookings WHERE member_id = %s AND class_id = %s AND status = 'Booked'",
        (member_id, class_id)
    )
    already_booked = cursor.fetchone()[0]
    if already_booked > 0:
        cursor.close()
        conn.close()
        return {"success": False, "error": "Member is already booked into this class", "booking_id": None}

    cursor.execute("""
        INSERT INTO class_bookings (member_id, class_id, status)
        VALUES (%s, %s, 'Booked')
    """, (member_id, class_id))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"success": True, "error": None, "booking_id": new_id}

def cancel_booking(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE class_bookings SET status = 'Cancelled' WHERE booking_id = %s
    """, (booking_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def mark_attended(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE class_bookings SET status = 'Attended' WHERE booking_id = %s
    """, (booking_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected