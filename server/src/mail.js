import nodemailer from 'nodemailer';

// Sends through any SMTP server (e.g. Gmail with an app password). Configured with
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM. Without them, emails are skipped.
let transporter;

export const mailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

function transport() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port,
      secure: port === 465, // 465 = TLS from the start; 587 upgrades with STARTTLS
      auth: { user: process.env.SMTP_USER.trim(), pass: process.env.SMTP_PASS.replace(/\s/g, '') },
      connectionTimeout: 10_000,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  if (!mailConfigured()) {
    console.warn(`Email not sent (SMTP not configured): ${subject}`);
    return null;
  }
  return transport().sendMail({
    from: process.env.MAIL_FROM?.trim() || process.env.SMTP_USER.trim(),
    to,
    subject,
    html,
    text,
  });
}

// The site's public address, for links and the logo. Taken from configuration only - never from
// request headers, which the sender of a request controls.
export function appUrl() {
  const configured = process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:5173';
}
