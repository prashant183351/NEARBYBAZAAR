// Alert email for queue poison pill
export async function sendAlertEmail(to: string, subject: string, text: string) {
  const mailFrom = process.env.MAIL_FROM || 'no-reply@nearbybazaar.com';
  return transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
  });
}
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const mailFrom = process.env.MAIL_FROM || 'no-reply@nearbybazaar.com';
  return transporter.sendMail({
    from: mailFrom,
    to,
    subject,
    text,
    html,
  });
}
