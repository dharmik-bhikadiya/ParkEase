import hashlib
import logging
import smtplib
import httpx
from typing import Tuple, Optional
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger("parkease.email_service")

def mask_email(email: str) -> str:
    """
    Safely masks recipient email address for logging.
    e.g., dharmik@gmail.com -> d*****k@gmail.com
    """
    if not email or "@" not in email:
        return "***"
    local_part, domain = email.split("@", 1)
    if len(local_part) <= 2:
        masked_local = local_part[0] + "*" * max(1, len(local_part) - 1)
    else:
        masked_local = local_part[0] + "*" * (len(local_part) - 2) + local_part[-1]
    return f"{masked_local}@{domain}"

def get_secret_fingerprint(secret: Optional[str]) -> str:
    """
    Returns non-reversible SHA-256 fingerprint (first 8 chars) of secret for logging matching status.
    """
    if not secret or not secret.strip():
        return "NONE"
    return hashlib.sha256(secret.strip().encode("utf-8")).hexdigest()[:8]

class EmailService:
    @staticmethod
    def _generate_otp_html(recipient_name: str, otp_code: str) -> str:
        current_year = datetime.now().year
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
    def send_otp_email(cls, recipient_email: str, recipient_name: str, otp_code: str) -> Tuple[bool, str]:
        """
        Dispatches a branded ParkEase HTML verification email.
        Primary Infrastructure: Supabase Edge Function / Resend HTTPS API (Port 443).
        Returns Tuple[bool, str] -> (success, diagnostic_message).
        """
        html_body = cls._generate_otp_html(recipient_name, otp_code)
        subject = "Verify your ParkEase account"
        masked_recipient = mask_email(recipient_email)

        # Check if any email infrastructure is configured
        if not settings.is_smtp_configured:
            if settings.ENVIRONMENT.lower() == "development":
                print(f"\n==================================================")
                print(f"[PARKEASE BRANDED EMAIL DISPATCH - MOCK DEV MODE]")
                print(f"To: {recipient_name} <{masked_recipient}>")
                print(f"Subject: {subject}")
                print(f"OTP Code: [{otp_code}] (Expires in 10 mins)")
                print(f"==================================================\n")
                logger.info(f"Mock email dispatched to {masked_recipient} in local development mode")
                return True, "Mock email dispatched in development mode"
            else:
                err_msg = "Production email infrastructure is not configured. Missing Supabase Function URL, Resend Key, or SMTP credentials."
                logger.error(
                    f"\n[EMAIL DELIVERY]\n"
                    f"Provider: NONE\n"
                    f"URL_CONFIGURED: False\n"
                    f"SECRET_CONFIGURED: False\n"
                    f"Recipient: {masked_recipient}\n"
                    f"OTP_PRESENT: True\n"
                    f"REQUEST_STARTED: False\n"
                    f"HTTP_STATUS: 0\n"
                    f"RESPONSE_OK: False\n"
                    f"ERROR_TYPE: CONFIGURATION_MISSING\n"
                    f"ERROR_MESSAGE: {err_msg}"
                )
                return False, err_msg

        # ------------------------------------------------------------------
        # STRATEGY 1: Supabase Edge Function (Primary HTTPS Infrastructure)
        # ------------------------------------------------------------------
        if settings.normalized_supabase_url:
            function_url = settings.normalized_supabase_url
            secret = settings.SUPABASE_EMAIL_FUNCTION_SECRET.strip() if settings.SUPABASE_EMAIL_FUNCTION_SECRET else None
            secret_configured = bool(secret)
            fingerprint = get_secret_fingerprint(secret)

            headers = {"Content-Type": "application/json"}
            if secret:
                headers["Authorization"] = f"Bearer {secret}"
                headers["apikey"] = secret

            payload = {
                "to": recipient_email,
                "recipient_name": recipient_name,
                "otp": otp_code,
                "expires_in_minutes": 10,
            }

            try:
                logger.info(f"[HTTPS EMAIL] Dispatching email request via Supabase Edge Function to {masked_recipient}...")
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(function_url, headers=headers, json=payload)
                
                http_status = resp.status_code
                response_ok = (http_status == 200)

                try:
                    resp_data = resp.json()
                except Exception:
                    resp_data = {}

                if response_ok and resp_data.get("success") is True:
                    logger.info(
                        f"\n[EMAIL DELIVERY]\n"
                        f"Provider: SUPABASE_EDGE_FUNCTION\n"
                        f"URL_CONFIGURED: True\n"
                        f"SECRET_CONFIGURED: {secret_configured} (Fingerprint: {fingerprint})\n"
                        f"Recipient: {masked_recipient}\n"
                        f"OTP_PRESENT: True\n"
                        f"REQUEST_STARTED: True\n"
                        f"HTTP_STATUS: {http_status}\n"
                        f"RESPONSE_OK: True\n"
                        f"ERROR_TYPE: NONE\n"
                        f"ERROR_MESSAGE: NONE"
                    )
                    return True, "Verification email dispatched successfully via Supabase Edge Function"
                else:
                    err_type = resp_data.get("error") or f"HTTP_{http_status}"
                    err_details = resp_data.get("details") or resp.text or "Supabase Edge Function request failed"

                    # Check for Resend free domain testing restrictions
                    err_details_str = str(err_details).lower()
                    if "only send testing emails" in err_details_str or "validation_error" in str(err_type).lower():
                        diagnostic_msg = (
                            f"Resend free testing domain (onboarding@resend.dev) is restricted to sending only to the registered account owner's email address. "
                            f"Details: {err_details}"
                        )
                    elif http_status == 401:
                        diagnostic_msg = "Authorization failed between Render backend and Supabase Edge Function (secret mismatch)."
                    elif http_status == 404:
                        diagnostic_msg = "Supabase Edge Function URL is invalid or function is not deployed."
                    else:
                        diagnostic_msg = f"Supabase Edge Function error ({err_type}): {err_details}"

                    logger.error(
                        f"\n[EMAIL DELIVERY]\n"
                        f"Provider: SUPABASE_EDGE_FUNCTION\n"
                        f"URL_CONFIGURED: True\n"
                        f"SECRET_CONFIGURED: {secret_configured} (Fingerprint: {fingerprint})\n"
                        f"Recipient: {masked_recipient}\n"
                        f"OTP_PRESENT: True\n"
                        f"REQUEST_STARTED: True\n"
                        f"HTTP_STATUS: {http_status}\n"
                        f"RESPONSE_OK: False\n"
                        f"ERROR_TYPE: {err_type}\n"
                        f"ERROR_MESSAGE: {diagnostic_msg}"
                    )
                    return False, diagnostic_msg

            except Exception as e:
                err_type = type(e).__name__
                err_msg = str(e)
                logger.error(
                    f"\n[EMAIL DELIVERY]\n"
                    f"Provider: SUPABASE_EDGE_FUNCTION\n"
                    f"URL_CONFIGURED: True\n"
                    f"SECRET_CONFIGURED: {secret_configured} (Fingerprint: {fingerprint})\n"
                    f"Recipient: {masked_recipient}\n"
                    f"OTP_PRESENT: True\n"
                    f"REQUEST_STARTED: True\n"
                    f"HTTP_STATUS: 0\n"
                    f"RESPONSE_OK: False\n"
                    f"ERROR_TYPE: {err_type}\n"
                    f"ERROR_MESSAGE: {err_msg}"
                )
                return False, f"Exception reaching Supabase Edge Function ({err_type}): {err_msg}"

        # ------------------------------------------------------------------
        # STRATEGY 2: Resend Direct HTTPS API (Direct Port 443 Fallback)
        # ------------------------------------------------------------------
        if settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip():
            resend_key = settings.RESEND_API_KEY.strip()
            from_sender = settings.PARKEASE_EMAIL_FROM or "ParkEase <onboarding@resend.dev>"
            
            headers = {
                "Authorization": f"Bearer {resend_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "from": from_sender,
                "to": [recipient_email],
                "subject": subject,
                "html": html_body,
            }

            try:
                logger.info(f"[HTTPS EMAIL] Dispatching email request via Resend API to {masked_recipient}...")
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post("https://api.resend.com/emails", headers=headers, json=payload)

                http_status = resp.status_code
                if http_status in (200, 201):
                    logger.info(
                        f"\n[EMAIL DELIVERY]\n"
                        f"Provider: RESEND_DIRECT_API\n"
                        f"URL_CONFIGURED: True\n"
                        f"SECRET_CONFIGURED: True\n"
                        f"Recipient: {masked_recipient}\n"
                        f"OTP_PRESENT: True\n"
                        f"REQUEST_STARTED: True\n"
                        f"HTTP_STATUS: {http_status}\n"
                        f"RESPONSE_OK: True\n"
                        f"ERROR_TYPE: NONE\n"
                        f"ERROR_MESSAGE: NONE"
                    )
                    return True, "Verification email dispatched successfully via Resend Direct API"
                else:
                    err_msg = f"Resend API HTTP {http_status}: {resp.text}"
                    logger.error(
                        f"\n[EMAIL DELIVERY]\n"
                        f"Provider: RESEND_DIRECT_API\n"
                        f"URL_CONFIGURED: True\n"
                        f"SECRET_CONFIGURED: True\n"
                        f"Recipient: {masked_recipient}\n"
                        f"OTP_PRESENT: True\n"
                        f"REQUEST_STARTED: True\n"
                        f"HTTP_STATUS: {http_status}\n"
                        f"RESPONSE_OK: False\n"
                        f"ERROR_TYPE: RESEND_HTTP_{http_status}\n"
                        f"ERROR_MESSAGE: {err_msg}"
                    )
                    return False, err_msg
            except Exception as e:
                err_msg = f"Exception calling Resend API: {type(e).__name__} - {str(e)}"
                logger.error(f"[HTTPS EMAIL] {err_msg}")
                return False, err_msg

        # ------------------------------------------------------------------
        # STRATEGY 3: Legacy SMTP Delivery Pipeline (If Host & Pass Set)
        # ------------------------------------------------------------------
        host = settings.SMTP_HOST.strip() if settings.SMTP_HOST else ""
        port = settings.SMTP_PORT
        user = settings.SMTP_USER.strip() if settings.SMTP_USER else ""
        password = settings.SMTP_PASSWORD.strip().strip('"').strip("'").replace(" ", "") if settings.SMTP_PASSWORD else ""
        
        raw_from = settings.EMAILS_FROM_EMAIL.strip() if settings.EMAILS_FROM_EMAIL else ""
        if not raw_from or raw_from == "noreply@parkease.com":
            from_email = user if ("gmail" in host.lower() and user) else (raw_from or user or "noreply@parkease.com")
        else:
            from_email = raw_from

        from_name = settings.EMAILS_FROM_NAME.strip() if settings.EMAILS_FROM_NAME else "ParkEase"

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
                    current_step = "EHLO_1"
                    server.ehlo()

                    if user and password:
                        current_step = "LOGIN"
                        server.login(user, password)

                    current_step = "SEND"
                    server.send_message(msg)
                    return True, "Verification email dispatched via SMTP SSL"
            else:
                current_step = "CONNECT"
                with smtplib.SMTP(host, port, timeout=15) as server:
                    current_step = "EHLO_1"
                    server.ehlo()

                    if settings.SMTP_TLS or port == 587:
                        current_step = "STARTTLS"
                        server.starttls()
                        current_step = "EHLO_2"
                        server.ehlo()

                    if user and password:
                        current_step = "LOGIN"
                        server.login(user, password)

                    current_step = "SEND"
                    server.send_message(msg)
                    return True, "Verification email dispatched via SMTP"

        except Exception as e:
            err_msg = f"SMTP Step {current_step} failed: {type(e).__name__} on {host}:{port} - {str(e)}"
            logger.error(f"[SMTP DIAGNOSTIC] {err_msg}")
            return False, err_msg

email_service = EmailService()

