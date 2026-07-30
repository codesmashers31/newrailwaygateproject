import nodemailer from 'nodemailer';

const mailSender = async (email, title, body) => {
  try {
    // Create a Transporter to send emails
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER || 'bsakthi691@gmail.com',
        pass: process.env.MAIL_PASS || 'gnzhkgsibyzrtwkr',
      },
      family: 4, // Force IPv4 resolution to prevent ENETUNREACH on Render
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000,
      socketTimeout: 10000,
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
