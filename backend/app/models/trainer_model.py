from app.db import get_db_connection
from app.utils.security import hash_password

def get_all_trainers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT trainer_id, first_name, last_name, email, phone, specialization, hire_date FROM trainers")
    trainers = cursor.fetchall()
    cursor.close()
    conn.close()
    return trainers

def get_trainer_by_id(trainer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT trainer_id, first_name, last_name, email, phone, specialization, hire_date FROM trainers WHERE trainer_id = %s", (trainer_id,))
    trainer = cursor.fetchone()
    cursor.close()
    conn.close()
    return trainer

def create_trainer(data):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT trainer_id FROM trainers WHERE email = %s", (data.get('email'),))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return {"success": False, "error": "Email is already registered to a trainer"}

    hashed_pw = hash_password(data.get('password'))

    cursor.execute("""
        INSERT INTO trainers (first_name, last_name, email, password, phone, specialization)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        data.get('first_name'),
        data.get('last_name'),
        data.get('email'),
        hashed_pw,
        data.get('phone'),
        data.get('specialization')
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"success": True, "trainer_id": new_id}

def update_trainer(trainer_id, data):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE trainers
        SET first_name=%s, last_name=%s, email=%s, phone=%s, specialization=%s
        WHERE trainer_id=%s
    """, (
        data.get('first_name'),
        data.get('last_name'),
        data.get('email'),
        data.get('phone'),
        data.get('specialization'),
        trainer_id
    ))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def update_trainer_password(trainer_id, new_password):
    conn = get_db_connection()
    cursor = conn.cursor()
    hashed_pw = hash_password(new_password)
    cursor.execute("UPDATE trainers SET password=%s WHERE trainer_id=%s", (hashed_pw, trainer_id))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected

def delete_trainer(trainer_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trainers WHERE trainer_id=%s", (trainer_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    return affected