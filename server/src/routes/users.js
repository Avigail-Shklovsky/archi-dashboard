import { Router } from 'express';
import User from '../models/User.js';

// Mounted behind requireAuth + requireAdmin: the people a project can be assigned to.
// A worker appears here after signing in to the system once.
const router = Router();

router.get('/', async (req, res) => {
  const users = await User.find({}, 'name email picture').sort({ name: 1 });
  res.json(users);
});

export default router;
