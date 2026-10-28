// Who may use the system, and who is an admin. Evaluated on every request, so a change
// (an admin removed from ADMIN_EMAILS, a worker removed from the team) takes effect immediately.

const entries = (name) =>
  (process.env[name] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export const adminEmails = () => entries('ADMIN_EMAILS');

// ADMIN_EMAILS: exact addresses only - a whole domain must never become admin by accident
export function isAdminEmail(email) {
  return entries('ADMIN_EMAILS').includes(String(email).toLowerCase());
}

export const roleOf = (email) => (isAdminEmail(email) ? 'admin' : 'user');

// Admins come from the server configuration; everyone else must have been added by an admin
export const hasAccess = (user) => Boolean(user) && (isAdminEmail(user.email) || user.allowed === true);
