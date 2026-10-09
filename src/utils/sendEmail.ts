import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Explicit SSL configuration on port 465 prevents Vercel network timeouts
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"Nova Bay" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error: any) {
    console.error("Nodemailer Error Details:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendEmail;