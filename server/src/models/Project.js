import mongoose from 'mongoose';
import { PROJECT_TYPES, PROJECT_CATEGORIES, DETAIL_LEVELS } from '../taskTemplates.js';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
  level: { type: Number, default: null }, // null = task added manually
  category: { type: String, default: null },
  templateKey: { type: String, default: null },
});

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
