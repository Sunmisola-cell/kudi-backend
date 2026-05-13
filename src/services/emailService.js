import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(toEmail, otp, fullName) {
  try {
    // fallback for development (no API key)
    if (!process.env.RESEND_API_KEY) {
      console.log('\n====== [DEV EMAIL] ======');
      console.log('To:   ', toEmail);
      console.log('OTP:  ', otp);
      console.log('=========================\n');
      return;
    }

    const response = await resend.emails.send({
      from: 'KudiTrack <otp@kuditrackapp.site>', // must match verified domain
      to: [toEmail], // always array
      subject: `${otp} — Your KudiTrack verification code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1117;border-radius:16px;color:#ffffff">
          
          <div style="background:#22c55e;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;font-size:24px;">
            ₦
          </div>

          <h2 style="font-size:22px;font-weight:700;margin:0 0 8px;">
            Verify your KudiTrack account
          </h2>

          <p style="color:#9ca3af;margin:0 0 24px;">
            Hi <strong style="color:#fff">${fullName}</strong>, use the code below to verify your account. It expires in <strong>10 minutes</strong>.
          </p>

          <div style="background:#1f2937;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;color:#22c55e;font-family:monospace">
            ${otp}
          </div>

          <p style="color:#6b7280;font-size:12px;margin-top:24px;text-align:center">
            If you didn’t request this, ignore this email.
          </p>
        </div>
      `,
    });

    console.log("✅ Email sent successfully:", response);

  } catch (err) {
    console.log("❌ Email sending failed:", err);
  }
}