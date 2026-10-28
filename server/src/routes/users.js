import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Project from '../models/Project.js';
import { isAdminEmail, hasAccess } from '../access.js';

// Mounted behind requireAuth + requireAdmin: the team. Only people listed here (and admins) can sign in.
const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/', async (req, res) => {
  const users = await User.find({}).sort({ name: 1 });
  res.json(users.filter(hasAccess));
});

// Add a worker by name + email. They can sign in with the Google account of that email.
router.post('/', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!name) return res.status(400).json({ error: 'יש להזין שם' });
  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'כתובת האימייל אינה תקינה' });

  const existing = await User.findOne({ email });
  if (existing && hasAccess(existing)) return res.status(409).json({ error: 'משתמש עם האימייל הזה כבר קיים' });

  const user = existing || new User({ email });
  user.set({ name, allowed: true });
  await user.save();
  res.status(201).json(user);
});

// Remove a worker: they lose access at once (their next request is refused). Their projects stay,
// unassigned, so an admin can hand them to someone else.
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'המשתמש לא נמצא' });
  const user = await User.findById(req.params.id);
  if (!user || !hasAccess(user)) return res.status(404).json({ error: 'המשתמש לא נמצא' });
  if (isAdminEmail(user.email)) return res.status(400).json({ error: 'מנהלים מוגדרים בהגדרות השרת (ADMIN_EMAILS) ולא ניתן להסיר אותם כאן' });

  user.allowed = false;
  await user.save();
  await Project.updateMany({ assignedTo: user._id }, { $set: { assignedTo: null } });
  res.status(204).end();
});

export default router;
