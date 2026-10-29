import { Router } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { requireAdmin } from '../middleware/auth.js';
import { hasAccess } from '../access.js';
import { notifyAssigned, notifySubmitted, notifyTasksAdded, removeProjectNotifications } from '../notify.js';
import {
  templateTasksFor, syncTasks, isValidPlace, TYPES_WITH_CATEGORIES, PROJECT_CATEGORIES, CATEGORY_LEVELS, DETAIL_LEVELS,
} from '../taskTemplates.js';

// Permissions (enforced here, on the server - the client only hides what it can't do):
// - admin: sees every project; creates, edits, assigns, prioritises, deletes; full control of tasks
// - user:  sees only projects assigned to them; may only tick tasks and submit once every task is done
const router = Router();
const INFO_FIELDS = ['title', 'categories', 'type', 'purpose', 'software', 'drawings', 'areaLevel', 'detailLevel', 'priority', 'assignedTo'];
// The fields the to-do list is built from
const STRUCTURE_FIELDS = ['type', 'categories', 'drawings', 'areaLevel', 'detailLevel', 'software'];
const NOT_FOUND = { error: 'הפרויקט לא נמצא' };

// Categories and levels: what the type and project names need is required, the rest is cleared.
// `data` holds the project's fields after the change. Returns an error message, or null when valid.
function normalizeStructure(data) {
  const valid = (list, value) => list.some((l) => l.value === value);
  if (!TYPES_WITH_CATEGORIES.includes(data.type)) {
    Object.assign(data, { categories: [], drawings: [], areaLevel: null, detailLevel: Number(data.detailLevel) });
    return valid(DETAIL_LEVELS, data.detailLevel) ? null : 'יש לבחור רמת פירוט';
  }
  data.detailLevel = null;
  data.categories = Array.isArray(data.categories) ? data.categories.filter((c) => PROJECT_CATEGORIES.includes(c)) : [];
  if (!data.categories.length) return 'יש לבחור לפחות שם פרויקט אחד';

  if (data.categories.includes('תכנון')) {
    const drawings = Array.isArray(data.drawings) ? [...new Set(data.drawings.map(Number))].sort((a, b) => a - b) : [];
    if (!drawings.length || !drawings.every((d) => valid(CATEGORY_LEVELS['תכנון'].levels, d))) return 'יש לבחור לפחות שרטוט אחד לתכנון';
    data.drawings = drawings;
  } else data.drawings = [];

  if (data.categories.includes('שטחים')) {
    data.areaLevel = Number(data.areaLevel);
    if (!valid(CATEGORY_LEVELS['שטחים'].levels, data.areaLevel)) return 'יש לבחור רמת פירוט לשטחים';
  } else data.areaLevel = null;
  return null;
}

// assignedTo must be empty or a member of the team (someone who can sign in). Returns an error message, or null when valid.
async function normalizeAssignee(data) {
  if (data.assignedTo === undefined) return null;
  if (data.assignedTo === null || data.assignedTo === '') {
    data.assignedTo = null;
    return null;
  }
  if (!mongoose.isValidObjectId(data.assignedTo) || !hasAccess(await User.findById(data.assignedTo))) {
    return 'המשתמש שנבחר לא נמצא';
  }
  return null;
}

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// Which projects the current user may see: everything for an admin, only their own assignments otherwise.
// Every query below goes through this, so a user can't reach another project even by guessing its id.
const visibleTo = (req) => (req.role === 'admin' ? {} : { assignedTo: req.userId });

const ASSIGNEE_FIELDS = 'name email picture';
const send = async (res, project, status = 200) =>
  res.status(status).json(await project.populate('assignedTo', ASSIGNEE_FIELDS));

// Load a project the current user may see, or respond 404 (also for projects that exist but
// aren't theirs, so ids of other people's projects can't be probed)
router.param('id', async (req, res, next, id) => {
  try {
    if (!mongoose.isValidObjectId(id)) return res.status(404).json(NOT_FOUND);
    req.project = await Project.findOne({ _id: id, ...visibleTo(req) });
    if (!req.project) return res.status(404).json(NOT_FOUND);
    next();
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res) => {
  const projects = await Project.find(visibleTo(req)).sort({ updatedAt: -1 }).populate('assignedTo', ASSIGNEE_FIELDS);
  res.json(projects);
});

router.post('/', requireAdmin, async (req, res) => {
  const data = pick(req.body, INFO_FIELDS);
  const error = normalizeStructure(data) || (await normalizeAssignee(data));
  if (error) return res.status(400).json({ error });
  if (!data.title?.trim()) return res.status(400).json({ error: 'יש להזין כינוי / כתובת לפרויקט' });
  const project = await Project.create({ ...data, owner: req.userId, tasks: templateTasksFor(data) });
  await notifyAssigned(project, req.user);
  await send(res, project, 201);
});

router.get('/:id', (req, res) => send(res, req.project));

router.patch('/:id', requireAdmin, async (req, res) => {
  const p = req.project;
  const structureOf = (obj) => JSON.stringify(STRUCTURE_FIELDS.map((k) => obj[k] ?? null));
  const before = structureOf(p.toObject());
  const data = { ...pick(p.toObject(), STRUCTURE_FIELDS), ...pick(req.body, INFO_FIELDS) };
  const error = normalizeStructure(data) || (await normalizeAssignee(data));
  if (error) return res.status(400).json({ error });
  const previousAssignee = p.assignedTo;
  const previousTaskIds = new Set(p.tasks.map((t) => t.id));
  p.set(data);
  if (structureOf(p.toObject()) !== before) {
    p.tasks = syncTasks(p.tasks.map((t) => t.toObject()), p.toObject());
  }
  await p.save();

  // A new assignee hears about the project; the same assignee hears about tasks the change added
  if (p.assignedTo && !p.assignedTo.equals(previousAssignee)) {
    await notifyAssigned(p, req.user);
  } else {
    await notifyTasksAdded(p, p.tasks.filter((t) => !previousTaskIds.has(t.id)).length, req.user);
  }
  await send(res, p);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await req.project.deleteOne();
  await removeProjectNotifications(req.project._id);
  res.status(204).end();
});

// Submit: only the assigned user, only while open, and only when every task is done.
// All three conditions are part of one atomic database update, so a task un-ticked at the
// same moment can't slip a project through half-done.
router.post('/:id/submit', async (req, res) => {
  const submitted = await Project.findOneAndUpdate(
    {
      _id: req.project._id,
      assignedTo: req.userId,
      status: 'open',
      'tasks.0': { $exists: true },
      tasks: { $not: { $elemMatch: { done: { $ne: true } } } },
    },
    { $set: { status: 'submitted', submittedAt: new Date() } },
    { new: true }
  );
  if (submitted) {
    await notifySubmitted(submitted, req.user);
    return send(res, submitted);
  }

  const p = req.project;
  if (!p.assignedTo?.equals(req.userId)) return res.status(403).json({ error: 'רק מי שהפרויקט משויך אליו יכול להגיש אותו' });
  if (p.status === 'submitted') return res.status(409).json({ error: 'הפרויקט כבר הוגש' });
  return res.status(400).json({ error: 'יש לסמן את כל המשימות כבוצעו לפני ההגשה' });
});

router.post('/:id/reopen', requireAdmin, async (req, res) => {
  req.project.set({ status: 'open', submittedAt: null });
  await req.project.save();
  await send(res, req.project);
});

router.post('/:id/tasks', requireAdmin, async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'יש להזין משימה' });
  req.project.tasks.push({ title });
  await req.project.save();
  await notifyTasksAdded(req.project, 1, req.user);
  await send(res, req.project, 201);
});

router.patch('/:id/tasks/:taskId', async (req, res) => {
  if (req.role !== 'admin') return toggleAsUser(req, res);

  const task = req.project.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'המשימה לא נמצאה' });
  task.set(pick(req.body, ['title', 'done']));

  // Tasks added by hand can be moved to any level of detailing (or back to "משימות נוספות" with level null)
  if (req.body.level !== undefined) {
    if (task.templateKey) return res.status(400).json({ error: 'ניתן להעביר רק משימות שנוספו ידנית' });
    const p = req.project;
    const level = req.body.level === null ? null : Number(req.body.level);
    const category = level === null ? null : (req.body.category ?? null);
    if (level !== null && !isValidPlace(p, level, category)) return res.status(400).json({ error: 'רמת פירוט לא תקינה' });
    task.set({ level, category });
  }

  await req.project.save();
  await send(res, req.project);
});

// A user may change exactly one thing: the "done" mark of a task in their own open project.
// The ownership and status checks are part of the update query itself.
async function toggleAsUser(req, res) {
  const keys = Object.keys(req.body || {});
  if (keys.length !== 1 || keys[0] !== 'done' || typeof req.body.done !== 'boolean') {
    return res.status(403).json({ error: 'רק מנהל יכול לערוך משימות' });
  }
  if (!mongoose.isValidObjectId(req.params.taskId)) return res.status(404).json({ error: 'המשימה לא נמצאה' });

  const updated = await Project.findOneAndUpdate(
    { _id: req.project._id, assignedTo: req.userId, status: 'open', 'tasks._id': req.params.taskId },
    { $set: { 'tasks.$.done': req.body.done } },
    { new: true }
  );
  if (updated) return send(res, updated);
  if (req.project.status !== 'open') return res.status(409).json({ error: 'הפרויקט הוגש ולא ניתן לשנות את המשימות' });
  return res.status(404).json({ error: 'המשימה לא נמצאה' });
}

router.delete('/:id/tasks/:taskId', requireAdmin, async (req, res) => {
  const task = req.project.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'המשימה לא נמצאה' });
  task.deleteOne();
  await req.project.save();
  await send(res, req.project);
});

export default router;
