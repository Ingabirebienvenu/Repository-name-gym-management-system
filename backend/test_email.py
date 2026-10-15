"""Run from the backend folder:  python test_email.py you@gmail.com"""
import sys
from app.utils.email_helper import send_email
from app.utils.email_templates import build_email

to = sys.argv[1] if len(sys.argv) > 1 else None
if not to:
    print("Usage: python test_email.py your_email@gmail.com")
    sys.exit(1)

ok = send_email(to, "Gym Manager test email",
                build_email("Email is working", "If you can read this, notifications will reach members."))
print("SENT" if ok else "FAILED - read the message printed above")