from app.db import get_db_connection
from app.utils.security import hash_password, verify_password

def register_member(data):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT member_id FROM members WHERE email = %s", (data.get('email'),))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return {"success": False, "error": "Email is already registered"}

    hashed_pw = hash_password(data.get('password'))

    cursor.execute("""
        INSERT INTO members (first_name, last_name, email, password, phone, date_of_birth, membership_type)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        data.get('first_name'),
        data.get('last_name'),
        data.get('email'),
        hashed_pw,
        data.get('phone'),
        data.get('date_of_birth'),
        data.get('membership_type', 'Basic')
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"success": True, "member_id": new_id}

def find_user_by_email(email):
    """
    Checks members, trainers, and admins tables in turn.
    Returns (user_dict, role) or (None, None) if not found.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT member_id AS id, first_name, last_name, email, password FROM members WHERE email = %s", (email,))
    member = cursor.fetchone()
    if member:
        cursor.close()
        conn.close()
        return member, 'member'

    cursor.execute("SELECT trainer_id AS id, first_name, last_name, email, password FROM trainers WHERE email = %s", (email,))
    trainer = cursor.fetchone()
    if trainer:
        cursor.close()
        conn.close()
        return trainer, 'trainer'

    cursor.execute("SELECT admin_id AS id, full_name, email, password FROM admins WHERE email = %s", (email,))
    admin = cursor.fetchone()
    if admin:
        cursor.close()
        conn.close()
        return admin, 'admin'

    cursor.close()
    conn.close()
    return None, None

def authenticate(email, plain_password):
    user, role = find_user_by_email(email)
    if not user:
        return {"success": False, "error": "Invalid email or password"}

    if not user.get('password'):
        return {"success": False, "error": "This account has no password set. Contact an admin."}

    if not verify_password(plain_password, user['password']):
        return {"success": False, "error": "Invalid email or password"}

    user.pop('password', None)  # never send the hash back
    return {"success": True, "user": user, "role": role}