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
        Uses real SMTP (Gmail/Port 587/STARTTLS) when configured.
        Falls back to local mock logger ONLY when ENVIRONMENT is 'development' and SMTP is not configured.
        """
        html_body = cls._generate_otp_html(recipient_name, otp_code)
        subject = "Verify your ParkEase account"

        # Check if SMTP is configured
        if not settings.is_smtp_configured:
            if settings.ENVIRONMENT.lower() == "development":
                print(f"\n==================================================")
                print(f"[PARKEASE BRANDED EMAIL DISPATCH - MOCK DEV MODE]")
                print(f"To: {recipient_name} <{recipient_email}>")
                print(f"Subject: {subject}")
                print(f"OTP Code: [{otp_code}] (Expires in 10 mins)")
                print(f"==================================================\n")
                logger.info(f"Mock email dispatched to {recipient_email} in local development mode")
                return True
            else:
                logger.error(
                    f"[SMTP DIAGNOSTIC] FAILED BEFORE CONNECT: SMTP credentials incomplete in production. "
                    f"SMTP_HOST_PRESENT={bool(settings.SMTP_HOST and settings.SMTP_HOST.strip())}, "
                    f"SMTP_USER_PRESENT={bool(settings.SMTP_USER and settings.SMTP_USER.strip())}, "
                    f"SMTP_PASSWORD_PRESENT={bool(settings.SMTP_PASSWORD and settings.SMTP_PASSWORD.strip())}"
                )
                return False

        # Real SMTP Delivery Pipeline
        host = settings.SMTP_HOST.strip() if settings.SMTP_HOST else ""
        port = settings.SMTP_PORT
        user = settings.SMTP_USER.strip() if settings.SMTP_USER else ""
        password = settings.SMTP_PASSWORD.strip().strip('"').strip("'") if settings.SMTP_PASSWORD else ""
        
        # Sender Email Fallback: Gmail SMTP requires From email to match authenticated user or authorized alias
        raw_from = settings.EMAILS_FROM_EMAIL.strip() if settings.EMAILS_FROM_EMAIL else ""
        if not raw_from or raw_from == "noreply@parkease.com":
            from_email = user if ("gmail" in host.lower() and user) else (raw_from or user or "noreply@parkease.com")
        else:
            from_email = raw_from

        from_name = settings.EMAILS_FROM_NAME.strip() if settings.EMAILS_FROM_NAME else "ParkEase"

        logger.info(f"[SMTP DIAGNOSTIC] Step 0: PREPARE -> Host='{host}', Port={port}, User='{user}', From='{from_email}', TLS={settings.SMTP_TLS or port==587}")

        current_step = "INIT"
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{from_name} <{from_email}>"
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

            if port == 465:
                current_step = "CONNECT"
                with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                    logger.info(f"[SMTP DIAGNOSTIC] Step 1: CONNECT -> SUCCESS to {host}:{port}")

                    current_step = "EHLO_1"
                    server.ehlo()
                    logger.info(f"[SMTP DIAGNOSTIC] Step 2: EHLO 1 -> SUCCESS")

                    if user and password:
                        current_step = "LOGIN"
                        server.login(user, password)
                        logger.info(f"[SMTP DIAGNOSTIC] Step 5: LOGIN -> SUCCESS for user '{user}'")
                    else:
                        logger.warning(f"[SMTP DIAGNOSTIC] Step 5: LOGIN -> SKIPPED (user or password empty)")

                    current_step = "SEND"
                    server.send_message(msg)
                    logger.info(f"[SMTP DIAGNOSTIC] Step 6: SEND -> SUCCESS! Message accepted by SMTP server for recipient '{recipient_email}'")

                    current_step = "QUIT"
                    return True
            else:
                current_step = "CONNECT"
                with smtplib.SMTP(host, port, timeout=15) as server:
                    logger.info(f"[SMTP DIAGNOSTIC] Step 1: CONNECT -> SUCCESS to {host}:{port}")

                    current_step = "EHLO_1"
                    server.ehlo()
                    logger.info(f"[SMTP DIAGNOSTIC] Step 2: EHLO 1 -> SUCCESS")

                    if settings.SMTP_TLS or port == 587:
                        current_step = "STARTTLS"
                        server.starttls()
                        logger.info(f"[SMTP DIAGNOSTIC] Step 3: STARTTLS -> SUCCESS")
                        current_step = "EHLO_2"
                        server.ehlo()
                        logger.info(f"[SMTP DIAGNOSTIC] Step 4: EHLO 2 -> SUCCESS")

                    if user and password:
                        current_step = "LOGIN"
                        server.login(user, password)
                        logger.info(f"[SMTP DIAGNOSTIC] Step 5: LOGIN -> SUCCESS for user '{user}'")
                    else:
                        logger.warning(f"[SMTP DIAGNOSTIC] Step 5: LOGIN -> SKIPPED (user or password empty)")

                    current_step = "SEND"
                    server.send_message(msg)
                    logger.info(f"[SMTP DIAGNOSTIC] Step 6: SEND -> SUCCESS! Message accepted by SMTP server for recipient '{recipient_email}'")

                    current_step = "QUIT"
                    return True

        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(
                f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: SMTPAuthenticationError on {host}:{port} for user '{user}': "
                f"code={auth_err.smtp_code}, msg={auth_err.smtp_error}. "
                f"CRITICAL: Gmail App Password is invalid/revoked or credentials are wrong."
            )
            return False
        except smtplib.SMTPConnectError as conn_err:
            logger.error(f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: SMTPConnectError to {host}:{port}: {conn_err}")
            return False
        except smtplib.SMTPServerDisconnected as disc_err:
            logger.error(f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: SMTPServerDisconnected from {host}:{port}: {disc_err}")
            return False
        except smtplib.SMTPSenderRefused as send_err:
            logger.error(f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: SMTPSenderRefused on {host}:{port}: {send_err}")
            return False
        except smtplib.SMTPRecipientsRefused as recip_err:
            logger.error(f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: SMTPRecipientRefused on {host}:{port}: {recip_err}")
            return False
        except smtplib.SMTPException as smtp_err:
            logger.error(f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: SMTPException on {host}:{port}: {type(smtp_err).__name__} - {smtp_err}")
            return False
        except (TimeoutError, OSError, Exception) as e:
            logger.error(f"[SMTP DIAGNOSTIC] Step {current_step} FAILED: {type(e).__name__} on {host}:{port} - {str(e)}")
            return False

email_service = EmailService()
