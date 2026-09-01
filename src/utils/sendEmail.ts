// import { Resend } from "resend";

// interface EmailOptions {
//   to: string;
//   subject: string;
//   html: string;
// }

// // Resend sends over HTTPS, not raw SMTP - this avoids the port-blocking
// // and timeout issues we hit with Gmail SMTP on Railway.
// const resend = new Resend(process.env.RESEND_API_KEY);

// export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
//   const { error } = await resend.emails.send({
//     // Resend's default test sender - works immediately with no domain setup.
//     // Once you verify a real domain on Resend, replace this with
//     // something like "Nova Bay <noreply@novabay.com>".
//     from: "Nova Bay <onboarding@resend.dev>",
//     to,
//     subject,
//     html,
//   });

//   if (error) {
//     throw new Error(`Failed to send email: ${error.message}`);
//   }
// };

// export default sendEmail;

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Nova Bay" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;