import { Router } from 'express';
import mongoose from 'mongoose';
import Project from '../models/Project.js';
import { templateTasksFor, syncTasks, TYPES_WITH_CATEGORIES, DETAIL_LEVELS, GENERAL_LEVEL } from '../taskTemplates.js';

const router = Router();
const INFO_FIELDS = ['title', 'categories', 'type', 'purpose', 'software', 'detailLevel'];

// Categories are required for types that use them and cleared for the rest.
// Returns an error message, or null when valid.
function normalizeCategories(data, type) {
  if (!TYPES_WITH_CATEGORIES.includes(type)) {
    data.categories = [];
    return null;
  }
  if (!Array.isArray(data.categories) || !data.categories.length) return 'יש לבחור לפחות שם פרויקט אחד';
  return null;
}

const pick = (obj, keys) =>
  Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// Load the project for the current user, or respond 404
router.param('id', async (req, res, next, id) => {
  try {
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'הפרויקט לא נמצא' });
    req.project = await Project.findOne({ _id: id, owner: req.userId });
    if (!req.project) return res.status(404).json({ error: 'הפרויקט לא נמצא' });
    next();
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res) => {
  const projects = await Project.find({ owner: req.userId }).sort({ updatedAt: -1 });
  res.json(projects);
});

router.post('/', async (req, res) => {
  const data = pick(req.body, INFO_FIELDS);
  data.detailLevel = Number(data.detailLevel);
  const categoriesError = normalizeCategories(data, data.type);
  if (categoriesError) return res.status(400).json({ error: categoriesError });
  if (!data.title?.trim()) return res.status(400).json({ error: 'יש להזין כינוי / כתובת לפרויקט' });
  const project = await Project.create({
    ...data,
    owner: req.userId,
    tasks: templateTasksFor(data.type, data.categories, data.detailLevel),
  });
  res.status(201).json(project);
});

router.get('/:id', (req, res) => res.json(req.project));

router.patch('/:id', async (req, res) => {
  const p = req.project;
  const data = pick(req.body, INFO_FIELDS);
  if (data.detailLevel !== undefined) data.detailLevel = Number(data.detailLevel);
  if (data.categories === undefined) data.categories = p.categories;
  const categoriesError = normalizeCategories(data, data.type ?? p.type);
  if (categoriesError) return res.status(400).json({ error: categoriesError });
  const structureChanged =
    (data.type !== undefined && data.type !== p.type) ||
    (data.detailLevel !== undefined && data.detailLevel !== p.detailLevel) ||
    data.categories.join() !== p.categories.join();
  p.set(data);
  if (structureChanged) {
    p.tasks = syncTasks(p.tasks.map((t) => t.toObject()), p.type, p.categories, p.detailLevel);
  }
  await p.save();
  res.json(p);
});

router.delete('/:id', async (req, res) => {
  await req.project.deleteOne();
  res.status(204).end();
});

router.post('/:id/tasks', async (req, res) => {
  const title = (req.body.title || '').trim();
  if (!title) return res.status(400).json({ error: 'יש להזין משימה' });
  req.project.tasks.push({ title });
  await req.project.save();
  res.status(201).json(req.project);
});

router.patch('/:id/tasks/:taskId', async (req, res) => {
  const task = req.project.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'המשימה לא נמצאה' });
  task.set(pick(req.body, ['title', 'done']));

  // Tasks added by hand can be moved to any level of detailing (or back to "משימות נוספות" with level null)
  if (req.body.level !== undefined) {
    if (task.templateKey) return res.status(400).json({ error: 'ניתן להעביר רק משימות שנוספו ידנית' });
    const p = req.project;
    const level = req.body.level === null ? null : Number(req.body.level);
    const validLevels = [GENERAL_LEVEL.value, ...DETAIL_LEVELS.map((l) => l.value)];
    if (level !== null && !validLevels.includes(level)) return res.status(400).json({ error: 'רמת פירוט לא תקינה' });
    let category = null;
    if (level !== null && TYPES_WITH_CATEGORIES.includes(p.type)) {
      category = req.body.category;
      if (!p.categories.includes(category)) return res.status(400).json({ error: 'שם פרויקט לא תקין' });
    }
    task.set({ level, category });
  }

  await req.project.save();
  res.json(req.project);
});

router.delete('/:id/tasks/:taskId', async (req, res) => {
  const task = req.project.tasks.id(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'המשימה לא נמצאה' });
  task.deleteOne();
  await req.project.save();
  res.json(req.project);
});

export default router;
