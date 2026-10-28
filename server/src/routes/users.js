import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { isAdminEmail, hasAccess } from '../access.js';

// Mounted behind requireAuth + requireAdmin: the team. Only people listed here (and admins) can sign in.
const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;

// Returns the trimmed name, or null when it's empty or too long
const cleanName = (value) => {
  const name = String(value ?? '').trim();
  return name && name.length <= MAX_NAME ? name : null;
};

// A team member by id (someone with access), or null
async function findMember(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  const user = await User.findById(id);
  return hasAccess(user) ? user : null;
}

router.get('/', async (req, res) => {
  const users = await User.find({}).sort({ name: 1 });
  res.json(users.filter(hasAccess));
});

// Add a worker by name + email. They can sign in with the Google account of that email.
router.post('/', async (req, res) => {
  const name = cleanName(req.body.name);
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!name) return res.status(400).json({ error: `יש להזין שם (עד ${MAX_NAME} תווים)` });
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'כתובת האימייל אינה תקינה' });

  const existing = await User.findOne({ email });
  if (existing && hasAccess(existing)) return res.status(409).json({ error: 'משתמש עם האימייל הזה כבר קיים' });

  const user = existing || new User({ email });
  user.set({ name, allowed: true });
  await user.save();
  res.status(201).json(user);
});

// Rename a team member. Only the name can change here: the email is the person's identity.
router.patch('/:id', async (req, res) => {
  const user = await findMember(req.params.id);
  if (!user) return res.status(404).json({ error: 'המשתמש לא נמצא' });
  const name = cleanName(req.body.name);
  if (!name) return res.status(400).json({ error: `יש להזין שם (עד ${MAX_NAME} תווים)` });
  user.name = name;
  await user.save();
  res.json(user);
});

// Remove a worker: they lose access at once (their next request is refused). Their projects stay,
// unassigned, so an admin can hand them to someone else.
router.delete('/:id', async (req, res) => {
  const user = await findMember(req.params.id);
  if (!user) return res.status(404).json({ error: 'המשתמש לא נמצא' });
  if (isAdminEmail(user.email)) return res.status(400).json({ error: 'מנהלים מוגדרים בהגדרות השרת (ADMIN_EMAILS) ולא ניתן להסיר אותם כאן' });

  user.allowed = false;
  await user.save();
  await Project.updateMany({ assignedTo: user._id }, { $set: { assignedTo: null } });
  res.status(204).end();
});

export default router;
