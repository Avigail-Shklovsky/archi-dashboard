// Who may use the system, and who is an admin. Evaluated on every request, so a change
// (an admin removed from ADMIN_EMAILS, a worker removed from the team) takes effect immediately.

const entries = (name) =>
  (process.env[name] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

// GHOST_EMAILS: sees everything without being part of the team - not listed anywhere, gets no notifications,
// can't change anything the team sees, and whatever they create is visible only to ghosts. Exact addresses only.
export function isGhostEmail(email) {
  return entries('GHOST_EMAILS').includes(String(email).toLowerCase());
}

// ADMIN_EMAILS: exact addresses only - a whole domain must never become admin by accident.
// A ghost address is never an admin, even if listed in both.
export function isAdminEmail(email) {
  return !isGhostEmail(email) && entries('ADMIN_EMAILS').includes(String(email).toLowerCase());
}

export const adminEmails = () => entries('ADMIN_EMAILS').filter(isAdminEmail);

export const roleOf = (email) => (isGhostEmail(email) ? 'ghost' : isAdminEmail(email) ? 'admin' : 'user');

// Admins and ghosts come from the server configuration; everyone else must have been added by an admin
export const hasAccess = (user) =>
  Boolean(user) && (isAdminEmail(user.email) || isGhostEmail(user.email) || user.allowed === true);

// Team members: everyone with access except ghosts
export const isTeamMember = (user) => hasAccess(user) && !isGhostEmail(user.email);
