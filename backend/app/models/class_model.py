from app.db import get_db_connection

def _format_class(cls):
    """Convert non-JSON-serializable fields (timedelta, date) to strings."""
    if cls is None:
        return cls
    if cls.get('start_time') is not None:
        cls['start_time'] = str(cls['start_time'])
    if cls.get('end_time') is not None:
        cls['end_time'] = str(cls['end_time'])
    return cls

def get_all_classes():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.*, t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
        FROM classes c
        LEFT JOIN trainers t ON c.trainer_id = t.trainer_id
    """)
    classes = cursor.fetchall()
    cursor.close()
    conn.close()
    return [_format_class(c) for c in classes]

def get_class_by_id(class_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT c.*, t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
        FROM classes c
        LEFT JOIN trainers t ON c.trainer_id = t.trainer_id
        WHERE c.class_id = %s
    """, (class_id,))
    cls = cursor.fetchone()
    cursor.close()
    conn.close()
    return _format_class(cls)

def create_class(data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO classes (class_name, description, trainer_id, schedule_day, start_time, end_time, capacity)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        data.get('class_name'),
        data.get('description'),
        data.get('trainer_id'),
        data.get('schedule_day'),
        data.get('start_time'),
        data.get('end_time'),
        data.get('capacity', 20)
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return new_id

def update_class(class_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE classes
        SET class_name=%s, description=%s, trainer_id=%s, schedule_day=%s, start_time=%s, end_time=%s, capacity=%s
        WHERE class_id=%s
    """, (
        data.get('class_name'),
        data.get('description'),
        data.get('trainer_id'),
        data.get('schedule_day'),
        data.get('start_time'),
        data.get('end_time'),
        data.get('capacity'),
        class_id
    ))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def delete_class(class_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM classes WHERE class_id=%s", (class_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected