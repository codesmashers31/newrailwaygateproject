import nodemailer from 'nodemailer';

const mailSender = async (email, title, body) => {
  const resendKey = process.env.RESEND_API_KEY;
  const brevoKey = process.env.BREVO_API_KEY;

  // 1. Try Brevo HTTP API (Port 443 - Sends to ANY email address on free tier)
  if (brevoKey) {
    try {
      console.log(`Sending email via Brevo HTTP API to ${email}...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'GateWatch', email: process.env.MAIL_USER || 'bsakthi691@gmail.com' },
          to: [{ email: email }],
          subject: title,
          htmlContent: body,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Brevo email sent successfully:', data);
        return data;
      }
      console.warn('⚠️ Brevo API returned error:', data.message || data);
    } catch (e) {
      console.warn('⚠️ Brevo fetch failed:', e.message);
    }
  }

  // 2. Try Resend HTTP API (Port 443 - Note: free test key only sends to account owner email)
  if (resendKey) {
    try {
      console.log(`Sending email via Resend HTTP API to ${email}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'GateWatch <onboarding@resend.dev>',
          to: [email],
          subject: title,
          html: body,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log('✅ Resend email sent successfully:', data);
        return data;
      }
      console.warn('⚠️ Resend API returned error:', data.message || data);
      throw new Error(data.message || 'Resend error');
    } catch (e) {
      console.warn('⚠️ Resend send failed:', e.message);
      // If Brevo key exists, don't fall back to SMTP on Render
      if (!brevoKey) {
        throw new Error(`Resend API: ${e.message}`);
      }
    }
  }

  // 3. Fallback to Nodemailer SMTP (Port 587 - Works on local server)
  console.log('Sending email via Nodemailer SMTP fallback...');
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER || 'bsakthi691@gmail.com',
      pass: process.env.MAIL_PASS || 'gnzhkgsibyzrtwkr',
    },
    family: 4,
    connectionTimeout: 4000, // 4s timeout so server never hangs
    greetingTimeout: 4000,
    socketTimeout: 4000,
  });

  let info = await transporter.sendMail({
    from: process.env.MAIL_USER || 'bsakthi691@gmail.com',
    to: email,
    subject: title,
    html: body,
  });
  return info;
};

export default mailSender;
