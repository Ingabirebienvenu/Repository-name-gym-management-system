from app.db import get_db_connection
from app.utils.security import hash_password

conn = get_db_connection()
cursor = conn.cursor()

email = "admin@gym.com"
password = "admin123"
full_name = "Kenny Admin"

# Remove any existing admin with this email first, to avoid duplicates
cursor.execute("DELETE FROM admins WHERE email = %s", (email,))

hashed = hash_password(password)
cursor.execute(
    "INSERT INTO admins (full_name, email, password) VALUES (%s, %s, %s)",
    (full_name, email, hashed)
)
conn.commit()
print(f"Admin created: {email} / {password}")

cursor.close()
conn.close()