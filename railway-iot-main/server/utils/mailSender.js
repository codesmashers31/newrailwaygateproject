import nodemailer from 'nodemailer';

const mailSender = async (email, title, body) => {
  try {
    // 1. Try Brevo HTTP API (Port 443 - Works on Render Free tier without SMTP blocks)
    if (process.env.BREVO_API_KEY) {
      console.log('Sending email via Brevo HTTP API...');
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'TrainGateView', email: process.env.MAIL_USER || 'bsakthi691@gmail.com' },
          to: [{ email: email }],
          subject: title,
          htmlContent: body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Brevo API error');
      }
      return data;
    }

    // 2. Try Resend HTTP API (Port 443 - Works on Render Free tier)
    if (process.env.RESEND_API_KEY) {
      console.log('Sending email via Resend HTTP API...');
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TrainGateView <onboarding@resend.dev>',
          to: [email],
          subject: title,
          html: body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Resend API error');
      }
      return data;
    }

    // 3. Fallback to Nodemailer SMTP (Port 587 - Works on local server / paid hosts)
    console.log('Sending email via Nodemailer SMTP...');
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for 587 (STARTTLS)
      auth: {
        user: process.env.MAIL_USER || 'bsakthi691@gmail.com',
        pass: process.env.MAIL_PASS || 'gnzhkgsibyzrtwkr',
      },
      family: 4, // Force IPv4 resolution to prevent ENETUNREACH on Render
      connectionTimeout: 15000, // 15 seconds timeout
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    // Send emails to users
    let info = await transporter.sendMail({
      from: process.env.MAIL_USER || 'bsakthi691@gmail.com',
      to: email,
      subject: title,
      html: body,
    });
    return info;
  } catch (error) {
    console.error('Error occurred while sending email:', error.message);
    throw error;
  }
};

export default mailSender;
