import { INK, esc, projectDetails, renderEmail } from './layout.js';

// Email to the assigned worker when their project is (or arrives) at high priority
export function highPriorityEmail({ project, worker, admin, url, logoUrl, title }) {
  const remaining = project.tasks.filter((t) => !t.done).length;
  const details = projectDetails(project, [
    ['משימות שנותרו', `${remaining} מתוך ${project.tasks.length}`],
    ['סומן על ידי', admin.name],
  ]);
  const subject = `עדיפות גבוהה: הפרויקט "${title}"`;

  const html = renderEmail({
    subject,
    preheader: `הפרויקט "${title}" סומן בעדיפות גבוהה על ידי ${admin.name}.`,
    badge: { text: ' עדיפות גבוהה !', color: '#b3261e', background: '#fbeceb' },
    title,
    intro: `שלום ${esc(worker.name)}, הפרויקט הזה משויך אלייך וסומן <strong style="color:${INK};">בעדיפות גבוהה</strong>. כדאי להקדים אותו לשאר העבודה.`,
    details,
    url,
    buttonText: 'מעבר לפרויקט',
    logoUrl,
  });

  const text = [
    `עדיפות גבוהה: הפרויקט "${title}"`,
    '',
    `שלום ${worker.name}, הפרויקט הזה משויך אלייך וסומן בעדיפות גבוהה.`,
    '',
    ...details.map(([k, v]) => `${k}: ${v}`),
    '',
    `מעבר לפרויקט: ${url}`,
  ].join('\n');

  return { subject, html, text };
}
