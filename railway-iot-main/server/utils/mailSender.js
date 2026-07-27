import nodemailer from 'nodemailer';

const mailSender = async (email, title, body) => {
  try {
    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
      service: process.env.MAIL_SERVICE || 'gmail', // defaults to gmail, set MAIL_SERVICE in .env if needed
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    });

    // Send emails to users
    let info = await transporter.sendMail({
      from: process.env.MAIL_USER || 'OTP Service <noreply@yourdomain.com>',
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
