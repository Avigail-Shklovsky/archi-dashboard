import express from 'express';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import {
  PROJECT_TYPES, TYPES_WITH_CATEGORIES, PROJECT_CATEGORIES, DETAIL_LEVELS, GENERAL_LEVEL, SOFTWARE_OPTIONS,
  PRIORITIES, STATUSES,
} from './taskTemplates.js';

// The Express app, shared by the local server (index.js) and the Vercel function (api/index.js)
const app = express();
app.use(express.json());

app.get('/api/meta', (req, res) =>
  res.json({
    projectTypes: PROJECT_TYPES,
    typesWithCategories: TYPES_WITH_CATEGORIES,
    projectCategories: PROJECT_CATEGORIES,
    detailLevels: DETAIL_LEVELS,
    generalLevel: GENERAL_LEVEL,
    softwareOptions: SOFTWARE_OPTIONS,
    priorities: PRIORITIES,
    statuses: STATUSES,
    googleClientId: process.env.GOOGLE_CLIENT_ID?.trim() || null,
  })
);
app.use('/api/auth', authRoutes);
app.use('/api/projects', requireAuth, projectRoutes);
app.use('/api/users', requireAuth, requireAdmin, userRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'לא נמצא' }));

export function addErrorHandler(app) {
  app.use((err, req, res, next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ error: 'נתונים לא תקינים - יש לבדוק את השדות' });
    console.error(err);
    res.status(500).json({ error: 'שגיאת שרת' });
  });
}

export default app;
