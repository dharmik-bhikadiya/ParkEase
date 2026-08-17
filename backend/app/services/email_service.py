import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger("parkease.email_service")

class EmailService:
    @staticmethod
    def _generate_otp_html(recipient_name: str, otp_code: str) -> str:
        current_year = datetime.now().year
        # Format OTP digits with space separation for readability
        spaced_otp = " ".join(otp_code)
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your ParkEase account</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #F7F9F5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #18342A;
      -webkit-font-smoothing: antialiased;
    }}
    .email-container {{
      max-width: 580px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 20px;
      border: 1px solid #E8F6EC;
      box-shadow: 0 4px 20px rgba(23, 107, 77, 0.05);
      overflow: hidden;
    }}
    .header {{
      background-color: #176B4D;
      padding: 28px 32px;
      text-align: center;
    }}
    .brand-title {{
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
    }}
    .brand-accent {{
      color: #72C98B;
    }}
    .brand-tagline {{
      color: rgba(255, 255, 255, 0.8);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      margin-top: 4px;
      text-transform: uppercase;
    }}
    .content {{
      padding: 36px 32px;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 700;
      color: #18342A;
      margin-top: 0;
      margin-bottom: 12px;
    }}
    .intro-text {{
      font-size: 15px;
      line-height: 1.6;
      color: #4A5568;
      margin-bottom: 28px;
    }}
    .otp-container {{
      background-color: #E8F6EC;
      border: 1px solid #72C98B;
      border-radius: 16px;
      padding: 28px 20px;
      text-align: center;
      margin-bottom: 28px;
    }}
    .otp-label {{
      font-size: 11px;
      font-weight: 800;
      color: #176B4D;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }}
    .otp-code {{
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #176B4D;
      letter-spacing: 8px;
      margin: 12px 0;
      display: inline-block;
    }}
    .otp-expiry {{
      font-size: 13px;
      font-weight: 600;
      color: #2D3748;
      margin-top: 8px;
    }}
    .security-notice {{
      background-color: #F7F9F5;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 28px;
      border-left: 4px solid #176B4D;
    }}
    .security-title {{
      font-size: 12px;
      font-weight: 700;
      color: #18342A;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }}
    .security-text {{
      font-size: 13px;
      color: #58667E;
      margin: 0;
      line-height: 1.5;
    }}
    .slogan-box {{
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: #176B4D;
      margin-bottom: 12px;
    }}
    .footer {{
      background-color: #F7F9F5;
      border-top: 1px solid #E8F6EC;
      padding: 20px 32px;
      text-align: center;
      font-size: 12px;
      color: #718096;
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="brand-title">Park<span class="brand-accent">Ease</span></div>
      <div class="brand-tagline">Park &bull; Book &bull; Move</div>
    </div>
    <div class="content">
      <h2 class="greeting">Hi {recipient_name},</h2>
      <p class="intro-text">
        Welcome to ParkEase! You're one step away from easier parking.<br>
        To complete your account registration, please use the verification code below:
      </p>
      
      <div class="otp-container">
        <div class="otp-label">YOUR VERIFICATION CODE</div>
        <div class="otp-code">{spaced_otp}</div>
        <div class="otp-expiry">Expires in 10 minutes</div>
      </div>

      <div class="security-notice">
        <div class="security-title">Security Note</div>
        <p class="security-text">
          ParkEase will never ask you to share your verification code with anyone.
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>

      <div class="slogan-box">
        Park. Book. Move.
      </div>
    </div>
    <div class="footer">
      &copy; {current_year} ParkEase. All rights reserved.
    </div>
  </div>
</body>
</html>"""

    @classmethod
    def send_otp_email(cls, recipient_email: str, recipient_name: str, otp_code: str) -> bool:
        """
        Dispatches a branded ParkEase HTML verification email.
        Uses real SMTP if configured; otherwise logs formatted email details cleanly for development.
        """
        html_body = cls._generate_otp_html(recipient_name, otp_code)
        subject = "Verify your ParkEase account"

        # Development / Testing Fallback Logger (No SMTP configured)
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            print(f"\n==================================================")
            print(f"[PARKEASE BRANDED EMAIL DISPATCH - MOCK DEV MODE]")
            print(f"To: {recipient_name} <{recipient_email}>")
            print(f"Subject: {subject}")
            print(f"OTP Code: [{otp_code}] (Expires in 10 mins)")
            print(f"==================================================\n")
            logger.info(f"Mock email dispatched to {recipient_email} with OTP code")
            return True

        # Production SMTP Dispatch
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = recipient_email

            text_fallback = (
                f"Hi {recipient_name},\n\n"
                f"Welcome to ParkEase!\n"
                f"Your verification code is: {otp_code}\n\n"
                f"This code will expire in 10 minutes.\n"
                f"Never share this code with anyone.\n\n"
                f"ParkEase - Park. Book. Move."
            )
            msg.attach(MIMEText(text_fallback, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASSWORD:
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [recipient_email], msg.as_string())
            
            logger.info(f"SMTP Email successfully sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMTP email to {recipient_email}: {str(e)}")
            # Fallback to dev log so system never crashes if SMTP has network issues
            print(f"[EMAIL FALLBACK LOGGER] SMTP dispatch failed: {str(e)}. OTP for {recipient_email}: [{otp_code}]")
            return False

email_service = EmailService()
