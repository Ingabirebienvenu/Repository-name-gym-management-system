import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import Config

def send_email(to_email, subject, html_body):
    """
    Sends an email via Gmail SMTP. Returns True on success, False on failure
    (failure is logged but never raises, so it never breaks the main request).
    """
    if not Config.MAIL_USERNAME or not Config.MAIL_PASSWORD:
        print("Email not sent: MAIL_USERNAME/MAIL_PASSWORD not configured in .env")
        return False

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = Config.MAIL_USERNAME
    msg['To'] = to_email
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
            server.sendmail(Config.MAIL_USERNAME, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def send_membership_confirmation_email(to_email, first_name, start_date, end_date, amount, method):
    subject = "Your Gym Membership is Confirmed!"
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1e293b;">Welcome, {first_name}! 🏋️</h2>
        <p>Your payment has been confirmed and your membership is now active.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 1.2rem 0;">
            <tr><td style="padding: 6px 0; color: #64748b;">Amount Paid</td><td style="padding: 6px 0; font-weight: bold;">{amount:,.0f} RWF</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Payment Method</td><td style="padding: 6px 0; font-weight: bold;">{method}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Membership Start</td><td style="padding: 6px 0; font-weight: bold;">{start_date}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Membership End</td><td style="padding: 6px 0; font-weight: bold;">{end_date}</td></tr>
        </table>
        <p>See you at the gym!</p>
        <p style="color: #94a3b8; font-size: 0.85rem;">— Gym Manager Team</p>
    </div>
    """
    return send_email(to_email, subject, html_body)


def send_payment_rejected_email(to_email, first_name, reason=None):
    subject = "Payment Could Not Be Verified"
    reason_line = f"<p>Reason: {reason}</p>" if reason else ""
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #1e293b;">Hi {first_name},</h2>
        <p>Unfortunately, we couldn't verify your recent payment submission.</p>
        {reason_line}
        <p>Please try submitting your payment again, or contact the gym front desk for help.</p>
        <p style="color: #94a3b8; font-size: 0.85rem;">— Gym Manager Team</p>
    </div>
    """
    return send_email(to_email, subject, html_body)