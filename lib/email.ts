import nodemailer from 'nodemailer';

// Email configuration
const smtpConfig = {
  host: process.env.SMTP_SERVER_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_SERVER_USERNAME || process.env.EMAIL_USER,
    pass: process.env.SMTP_SERVER_PASSWORD || process.env.EMAIL_PASS,
  },
};

// Create reusable transporter
export const createTransporter = async () => {
  // Create a transporter
  const transporter = nodemailer.createTransport(smtpConfig);

  // Verify connection
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return transporter;
  } catch (error) {
    console.error('SMTP connection error:', error);
    throw new Error('Failed to establish SMTP connection');
  }
};

// Send an email
export const sendEmail = async ({
  to,
  subject,
  html,
  from = process.env.SMTP_SERVER_USERNAME || process.env.EMAIL_USER,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) => {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"Admin Dashboard" <${from}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_SERVER_USERNAME,
    pass: process.env.SMTP_SERVER_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, otpCode: string) {
  await transporter.sendMail({
    from: process.env.SMTP_SERVER_USERNAME,
    to: email,
    subject: 'Verify Your Email',
    html: `
      <h1>Email Verification</h1>
      <p>Your verification code is: <strong>${otpCode}</strong></p>
      <p>This code will expire in 15 minutes.</p>
    `,
  });
}
