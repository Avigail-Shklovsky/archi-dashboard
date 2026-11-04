import mongoose from 'mongoose';

export const MAX_NOTE_LENGTH = 5000;

// A person's private notes on a project. Only its writer ever gets it back - no admin or ghost can read it.
const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    text: { type: String, default: '', maxlength: MAX_NOTE_LENGTH },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, project: 1 }, { unique: true });
noteSchema.index({ project: 1 });

export default mongoose.model('Note', noteSchema);
