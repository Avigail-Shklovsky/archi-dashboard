// Who may sign in, and who is an admin. Both come from environment variables and are
// evaluated on every request, so a change takes effect immediately (no stale role in a token).

const entries = (name) =>
  (process.env[name] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// ADMIN_EMAILS: exact addresses only - a whole domain must never become admin by accident
export function isAdminEmail(email) {
  return entries('ADMIN_EMAILS').includes(String(email).toLowerCase());
}

// ALLOWED_EMAILS: addresses and/or "@domain" entries; empty = any Google account. Admins are always allowed.
export function isAllowed(email) {
  const list = entries('ALLOWED_EMAILS');
  email = String(email).toLowerCase();
  if (!list.length || isAdminEmail(email)) return true;
  return list.some((entry) => (entry.startsWith('@') ? email.endsWith(entry) : email === entry));
}

export const roleOf = (email) => (isAdminEmail(email) ? 'admin' : 'user');
