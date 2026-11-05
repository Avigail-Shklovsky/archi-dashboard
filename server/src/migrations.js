import mongoose from 'mongoose';
import { templateTasksFor } from './taskTemplates.js';

// Data changes needed after renames. Each step finds nothing to do once it has run,
// so running them on every start is safe.

// The project name "תכנון" became "תכנון אדריכלי" - in the project's names, its tasks and their template keys
async function renamePlanning() {
  const from = 'תכנון';
  const to = 'תכנון אדריכלי';
  const projects = mongoose.connection.collection('projects');
  const affected = await projects.find({ $or: [{ categories: from }, { 'tasks.category': from }] }).toArray();
  for (const p of affected) {
    const categories = (p.categories || []).map((c) => (c === from ? to : c));
    const tasks = (p.tasks || []).map((t) => ({
      ...t,
      category: t.category === from ? to : t.category,
      templateKey: t.templateKey?.replace(`:${from}:`, `:${to}:`) ?? null,
    }));
    await projects.updateOne({ _id: p._id }, { $set: { categories, tasks } });
  }
  if (affected.length) console.log(`Renamed "${from}" to "${to}" in ${affected.length} projects`);
}

// Each level now opens with its own name as a task ("חזיתות"). Open projects get them at the top of their
// levels; submitted ones stay as they were. Runs once (recorded in "migrations"), so a level-name task an
// admin deletes later is not brought back.
async function addLevelNameTasks() {
  // Claimed first: if two server instances start together, only the one whose insert succeeds runs it
  try {
    await mongoose.connection.collection('migrations').insertOne({ _id: 'level-name-tasks', at: new Date() });
  } catch (err) {
    if (err.code === 11000) return; // already done (or being done)
    throw err;
  }
  const projects = mongoose.connection.collection('projects');
  let count = 0;
  for (const p of await projects.find({ status: { $ne: 'submitted' } }).toArray()) {
    const tasks = p.tasks || [];
    const have = new Set(tasks.map((t) => t.templateKey).filter(Boolean));
    const missing = templateTasksFor(p)
      .filter((t) => t.templateKey.endsWith(':name') && !have.has(t.templateKey))
      .map((t) => ({ _id: new mongoose.Types.ObjectId(), ...t }));
    if (!missing.length) continue;
    await projects.updateOne({ _id: p._id }, { $set: { tasks: [...missing, ...tasks] } });
    count++;
  }
  if (count) console.log(`Added level-name tasks to ${count} open projects`);
}

export async function migrate() {
  await renamePlanning();
  await addLevelNameTasks();
}
