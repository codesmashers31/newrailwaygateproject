import nodemailer from 'nodemailer';

const mailSender = async (email, title, body) => {
  try {
    // Create a Transporter to send emails
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
