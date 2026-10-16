import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, text }) {
  // Dev mode: no SMTP configured, just print to the console
  if (!process.env.SMTP_HOST) {
    console.log(`\n[DEV EMAIL] To: ${to}\n${subject}\n${text}\n`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
}
