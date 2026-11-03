import { NAVY, INK, PAGE, FONT, esc, formatDate, projectDetails, renderEmail } from './layout.js';

// Email to admins when a worker submits a project
export function projectSubmittedEmail({ project, worker, url, logoUrl, title }) {
  const done = project.tasks.filter((t) => t.done).length;
  const total = project.tasks.length;
  const details = projectDetails(project, [
    ['הוגש על ידי', worker.name],
    ['מועד ההגשה', formatDate(project.submittedAt || Date.now())],
  ]);
  const subject = `הפרויקט "${title}" הוגש על ידי ${worker.name}`;

  const progress = `
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="right" style="font:600 13px/1 ${FONT};color:${INK};padding-bottom:8px;">משימות שבוצעו</td>
                  <td align="left" style="font:700 13px/1 ${FONT};color:${NAVY};padding-bottom:8px;" dir="ltr">${done} / ${total}</td>
                </tr>
                <tr>
                  <td colspan="2" style="background:${PAGE};border-radius:999px;height:8px;font-size:0;line-height:0;">
                    <div style="width:${total ? Math.round((done / total) * 100) : 0}%;height:8px;background:${NAVY};border-radius:999px;">&nbsp;</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
`;

  const html = renderEmail({
    subject,
    preheader: `${worker.name} סיימה את כל ${total} המשימות והגישה את הפרויקט.`,
    badge: { text: '✓ הפרויקט הוגש', color: '#1e6b3a', background: '#e6f2ea' },
    title,
    intro: `<strong style="color:${INK};">${esc(worker.name)}</strong> סיימה את כל המשימות והגישה את הפרויקט לבדיקה.`,
    between: progress,
    details,
    url,
    buttonText: 'צפייה בפרויקט',
    note: 'אם הפרויקט צריך תיקונים, אפשר לפתוח אותו מחדש מתוך המערכת.',
    logoUrl,
  });

  const text = [
    `הפרויקט "${title}" הוגש`,
    '',
    `${worker.name} סיימה את כל המשימות (${done}/${total}) והגישה את הפרויקט.`,
    '',
    ...details.map(([k, v]) => `${k}: ${v}`),
    '',
    `צפייה בפרויקט: ${url}`,
  ].join('\n');

  return { subject, html, text };
}
