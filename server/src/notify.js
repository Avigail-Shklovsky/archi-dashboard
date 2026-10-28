import Notification from './models/Notification.js';
import User from './models/User.js';
import { adminEmails } from './access.js';

// Notifications are a side effect: if creating one fails, the action that triggered it still succeeds.
const safely = (fn) => async (...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error('notification failed', err);
  }
};

export const titleOf = (project) => project.title || project.categories?.join(' · ') || project.type;

// Admin: a worker submitted a project
export const notifySubmitted = safely(async (project, actor) => {
  const admins = await User.find({ email: { $in: adminEmails() } }, '_id');
  await Notification.insertMany(
    admins.map((a) => ({
      user: a._id,
      type: 'project_submitted',
      project: project._id,
      projectTitle: titleOf(project),
      actorName: actor.name,
    }))
  );
});

// Worker: a project was assigned to them
export const notifyAssigned = safely(async (project, actor) => {
  if (!project.assignedTo || project.assignedTo.equals(actor._id)) return;
  await Notification.create({
    user: project.assignedTo,
    type: 'project_assigned',
    project: project._id,
    projectTitle: titleOf(project),
    actorName: actor.name,
  });
});

// Worker: new tasks in a project already assigned to them. While the last such notice is unread it is
// updated ("3 new tasks") instead of adding one per task.
export const notifyTasksAdded = safely(async (project, count, actor) => {
  if (!project.assignedTo || count < 1 || project.assignedTo.equals(actor._id)) return;
  const updated = await Notification.findOneAndUpdate(
    { user: project.assignedTo, project: project._id, type: 'tasks_added', read: false },
    { $inc: { count }, $set: { createdAt: new Date(), projectTitle: titleOf(project), actorName: actor.name } }
  );
  if (!updated) {
    await Notification.create({
      user: project.assignedTo,
      type: 'tasks_added',
      project: project._id,
      projectTitle: titleOf(project),
      actorName: actor.name,
      count,
    });
  }
});

export const removeProjectNotifications = safely((projectId) => Notification.deleteMany({ project: projectId }));
