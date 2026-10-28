import mongoose from 'mongoose';
import { PROJECT_TYPES, PROJECT_CATEGORIES, DETAIL_LEVELS, PRIORITIES, STATUSES } from '../taskTemplates.js';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
  level: { type: Number, default: null }, // null = task added manually
  category: { type: String, default: null },
  templateKey: { type: String, default: null },
});

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // the admin who created it
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    priority: { type: String, enum: PRIORITIES.map((p) => p.value), default: 'medium' },
    status: { type: String, enum: STATUSES.map((s) => s.value), default: 'open' },
    submittedAt: { type: Date, default: null },
    title: { type: String, trim: true, default: '' }, // free text: nickname / address
    // "שם הפרויקט" - one or more of the fixed categories; only used for פנים projects
    categories: {
      type: [{ type: String, enum: PROJECT_CATEGORIES }],
      validate: (v) => new Set(v).size === v.length,
    },
    type: { type: String, enum: PROJECT_TYPES, required: true },
    purpose: { type: String, trim: true, default: '' },
    software: { type: String, trim: true, default: '' },
    detailLevel: { type: Number, enum: DETAIL_LEVELS.map((l) => l.value), required: true },
    tasks: [taskSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
