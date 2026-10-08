import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your 16-character App Password
  },
});

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  try {
    // CRITICAL FOR VERCEL: Always await sendMail so the serverless function doesn't freeze prematurely
    await transporter.sendMail({
      from: `"Nova Bay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendEmail;