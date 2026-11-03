import { PRIORITIES, TYPES_WITH_CATEGORIES, levelSummary } from '../taskTemplates.js';

// The shared design of the system's emails. Built with tables and inline styles,
// which is what email clients (Gmail, Outlook, phones) render reliably.

export const NAVY = '#1c3c62';
export const GOLD = '#d6a44f';
export const INK = '#1d1d1b';
export const MUTED = '#6f6c66';
export const LINE = '#e2dfd8';
export const PAGE = '#f4f3f0';
export const FONT = "Heebo, 'Segoe UI', Arial, Helvetica, sans-serif";

// Names and titles are typed by people: escape them so they can't inject HTML into the email
export const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const label = (list, value) => list.find((x) => x.value === value)?.label ?? value;

export function formatDate(date) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jerusalem',
  }).format(new Date(date));
}

// The project's details as [label, value] rows, without empty ones; `extra` rows go at the end
export function projectDetails(project, extra = []) {
  return [
    ['כינוי / כתובת', project.title],
    ...(TYPES_WITH_CATEGORIES.includes(project.type) && project.categories?.length ? [['שם הפרויקט', project.categories.join(' · ')]] : []),
    ['סוג הפרויקט', project.type],
    ['רמת פירוט', levelSummary(project)],
    ['עדיפות', label(PRIORITIES, project.priority)],
    ['תוכנה', project.software],
    ...extra,
  ].filter(([, value]) => value);
}

// badge: { text, color, background }. intro and between are HTML (escape what goes in them).
export function renderEmail({ subject, preheader, badge, title, intro, between = '', details, url, buttonText, note, logoUrl }) {
  const rows = details
    .map(
      ([k, v], i) => `
              <tr>
                <td style="padding:10px 0;border-top:${i ? `1px solid ${LINE}` : '0'};font:400 14px/1.4 ${FONT};color:${MUTED};width:38%;vertical-align:top;">${esc(k)}</td>
                <td style="padding:10px 0;border-top:${i ? `1px solid ${LINE}` : '0'};font:600 14px/1.4 ${FONT};color:${INK};vertical-align:top;">${esc(v)}</td>
              </tr>`
    )
    .join('');

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};" dir="rtl">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${LINE};" dir="rtl">

          <tr>
            <td style="height:5px;background:${NAVY};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="right" style="padding:24px 32px 8px;">
              <img src="${esc(logoUrl)}" width="132" alt="תלם מדידות הנדסיות" style="display:block;border:0;height:auto;max-width:132px;">
            </td>
          </tr>

          <tr>
            <td align="right" style="padding:16px 32px 0;">
              <span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${badge.background};color:${badge.color};font:700 12px/1 ${FONT};">${esc(badge.text)}</span>
              <h1 style="margin:16px 0 8px;font:700 24px/1.3 ${FONT};color:${INK};">${esc(title)}</h1>
              <p style="margin:0;font:400 15px/1.6 ${FONT};color:${MUTED};">${intro}</p>
            </td>
          </tr>
${between}
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f7;border:1px solid ${LINE};border-radius:10px;">
                <tr>
                  <td style="padding:6px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 32px;">
              <a href="${esc(url)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font:700 15px/1 ${FONT};padding:15px 32px;border-radius:10px;">${esc(buttonText)}</a>
              ${note ? `<p style="margin:14px 0 0;font:400 12px/1.5 ${FONT};color:${MUTED};">${esc(note)}</p>` : ''}
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px;background:#faf9f7;border-top:1px solid ${LINE};" align="center">
              <p style="margin:0;font:400 12px/1.5 ${FONT};color:${MUTED};">
                הודעה אוטומטית ממערכת ניהול הפרויקטים של <span style="color:${GOLD};font-weight:700;">תלם מדידות הנדסיות</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
