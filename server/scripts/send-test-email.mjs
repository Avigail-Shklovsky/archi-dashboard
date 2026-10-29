// Sends the "project submitted" email with sample data, to check the SMTP settings and the design.
// Usage (from the repo root):  npm run test-email -w server -- someone@example.com
import 'dotenv/config';
import { sendMail, mailConfigured, appUrl } from '../src/mail.js';
import { projectSubmittedEmail } from '../src/emails/projectSubmitted.js';

const to = process.argv[2];
if (!to || !to.includes('@')) {
  console.error('Usage: npm run test-email -w server -- someone@example.com');
  process.exit(1);
}
if (!mailConfigured()) {
  console.error('SMTP is not configured: set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env');
  process.exit(1);
}

const base = appUrl();
const project = {
  _id: 'example',
  title: 'הרצל 12, רעננה',
  type: 'פנים',
  categories: ['תכנון אדריכלי', 'שטחים'],
  drawings: [1, 2],
  areaLevel: 2,
  priority: 'high',
  software: 'Revit',
  submittedAt: new Date(),
  tasks: Array.from({ length: 14 }, () => ({ done: true })),
};
const email = projectSubmittedEmail({
  project,
  worker: { name: 'דנה כהן' },
  title: project.title,
  url: `${base}/`,
  logoUrl: `${base.startsWith('http://localhost') ? 'https://raw.githubusercontent.com/Avigail-Shklovsky/archi-dashboard/main/client/public' : base}/logo.png`,
});

try {
  const info = await sendMail({ to, ...email, subject: `[בדיקה] ${email.subject}` });
  console.log(`Sent to ${to} (${info.messageId})`);
} catch (err) {
  console.error(`Sending failed: ${err.message}`);
  process.exit(1);
}
