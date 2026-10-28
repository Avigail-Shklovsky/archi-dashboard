import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = ['project_submitted', 'project_assigned', 'tasks_added'];

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // the recipient
  type: { type: String, enum: NOTIFICATION_TYPES, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectTitle: { type: String, default: '' }, // kept so the text still reads well if the project is renamed
  actorName: { type: String, default: '' }, // who did it
  count: { type: Number, default: 1 }, // tasks_added: how many
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }, // removed after 90 days
});

notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.methods.toJSON = function () {
  return {
    id: this._id,
    type: this.type,
    project: this.project,
    projectTitle: this.projectTitle,
    actorName: this.actorName,
    count: this.count,
    read: this.read,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('Notification', notificationSchema);
