import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const PARKEASE_EMAIL_FUNCTION_SECRET = Deno.env.get("PARKEASE_EMAIL_FUNCTION_SECRET");
const PARKEASE_EMAIL_FROM = Deno.env.get("PARKEASE_EMAIL_FROM") || "ParkEase <onboarding@resend.dev>";

interface VerificationEmailPayload {
  to: string;
  recipient_name: string;
  otp: string;
  expires_in_minutes?: number;
}

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const authConfigured = Boolean(PARKEASE_EMAIL_FUNCTION_SECRET && PARKEASE_EMAIL_FUNCTION_SECRET.trim());
  const resendKeyConfigured = Boolean(RESEND_API_KEY && RESEND_API_KEY.trim());
  let authValid = true;

  try {
    // 1. Verify Authorization Header (Server-to-Server Bearer Secret)
    if (authConfigured) {
      const authHeader = req.headers.get("Authorization");
      const expectedHeader = `Bearer ${PARKEASE_EMAIL_FUNCTION_SECRET?.trim()}`;
      if (!authHeader || authHeader !== expectedHeader) {
        authValid = false;
        console.warn("[PARKEASE EMAIL FUNCTION] REQUEST_RECEIVED=true AUTH_CONFIGURED=true AUTH_VALID=false");
        return new Response(
          JSON.stringify({
            success: false,
            error: "UNAUTHORIZED_SERVER_REQUEST",
            details: "Authorization Bearer secret mismatch between Render backend and Supabase Edge Function."
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // 2. Parse & Validate Payload
    const body: VerificationEmailPayload = await req.json();
    const { to, recipient_name, otp } = body;
    const recipientValid = Boolean(to && to.includes("@"));
    const otpValid = Boolean(otp && otp.trim());

    if (!recipientValid || !otpValid) {
      console.warn(`[PARKEASE EMAIL FUNCTION] REQUEST_RECEIVED=true AUTH_VALID=${authValid} RECIPIENT_VALID=${recipientValid}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYLOAD_MISSING_TO_OR_OTP",
          details: "Recipient email or OTP code is missing or invalid."
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!resendKeyConfigured) {
      console.error("[PARKEASE EMAIL FUNCTION] RESEND_KEY_CONFIGURED=false. Missing RESEND_API_KEY in Supabase secrets.");
      return new Response(
        JSON.stringify({
          success: false,
          error: "MISSING_RESEND_API_KEY",
          details: "RESEND_API_KEY is not configured in Supabase Edge Function secrets."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Build HTML Email Body with ParkEase Branding
    const spacedOtp = otp.split("").join(" ");
    const currentYear = new Date().getFullYear();
    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your ParkEase account</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F9F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18342A;">
  <div style="max-width:580px;margin:30px auto;background-color:#ffffff;border-radius:20px;border:1px solid #E8F6EC;overflow:hidden;box-shadow:0 4px 20px rgba(23,107,77,0.05);">
    <div style="background-color:#176B4D;padding:28px 32px;text-align:center;">
      <div style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Park<span style="color:#72C98B;">Ease</span></div>
      <div style="color:rgba(255,255,255,0.8);font-size:10px;font-weight:700;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">PARK &bull; BOOK &bull; MOVE</div>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="font-size:20px;font-weight:700;color:#18342A;margin-top:0;margin-bottom:12px;">Hi ${recipient_name || "Valued User"},</h2>
      <p style="font-size:15px;line-height:1.6;color:#4A5568;margin-bottom:28px;">
        Welcome to ParkEase! You're one step away from easier parking.<br>
        To complete your account registration, please use the verification code below:
      </p>
      
      <div style="background-color:#E8F6EC;border:1px solid #72C98B;border-radius:16px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <div style="font-size:11px;font-weight:800;color:#176B4D;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">YOUR VERIFICATION CODE</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:800;color:#176B4D;letter-spacing:8px;margin:12px 0;">${spacedOtp}</div>
        <div style="font-size:13px;font-weight:600;color:#2D3748;margin-top:8px;">Expires in 10 minutes</div>
      </div>

      <div style="background-color:#F7F9F5;border-radius:12px;padding:16px 20px;margin-bottom:28px;border-left:4px solid #176B4D;">
        <div style="font-size:12px;font-weight:700;color:#18342A;margin:0 0 4px 0;text-transform:uppercase;">Security Note</div>
        <p style="font-size:13px;color:#58667E;margin:0;line-height:1.5;">
          ParkEase will never ask you to share your verification code with anyone.
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>

      <div style="text-align:center;font-size:14px;font-weight:600;color:#176B4D;">
        Park. Book. Move.
      </div>
    </div>
    <div style="background-color:#F7F9F5;border-top:1px solid #E8F6EC;padding:20px 32px;text-align:center;font-size:12px;color:#718096;">
      &copy; ${currentYear} ParkEase. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    // 4. Dispatch Email via Resend HTTPS API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: PARKEASE_EMAIL_FROM,
        to: [to],
        subject: "Verify your ParkEase account",
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();
    const resendStatus = resendResponse.status;
    const resendSuccess = resendResponse.ok;

    console.log(`[PARKEASE EMAIL FUNCTION]
REQUEST_RECEIVED=true
AUTH_CONFIGURED=${authConfigured}
AUTH_VALID=true
RESEND_KEY_CONFIGURED=true
RECIPIENT_VALID=true
RESEND_REQUEST_STARTED=true
RESEND_HTTP_STATUS=${resendStatus}
RESEND_SUCCESS=${resendSuccess}`);

    if (!resendSuccess) {
      console.error(`[PARKEASE EMAIL FUNCTION] Resend API Error (${resendStatus}):`, JSON.stringify({
        name: resendData.name || "RESEND_ERROR",
        message: resendData.message || "No error message provided"
      }));

      const outStatus = resendStatus >= 400 && resendStatus < 600 ? resendStatus : 502;
      return new Response(
        JSON.stringify({
          success: false,
          error: resendData.name || "RESEND_API_ERROR",
          details: resendData.message || "Failed to dispatch email via Resend HTTPS API",
        }),
        { status: outStatus, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message_id: resendData.id }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[PARKEASE EMAIL FUNCTION] Exception:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: "INTERNAL_EDGE_FUNCTION_EXCEPTION", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

