import mongoose from 'mongoose';

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

export async function migrate() {
  await renamePlanning();
}
