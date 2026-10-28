import { Router } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

// Mounted behind requireAuth. Every query is limited to the signed-in user's own notifications.
const router = Router();
const LIMIT = 30;

router.get('/', async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.userId }).sort({ createdAt: -1 }).limit(LIMIT),
    Notification.countDocuments({ user: req.userId, read: false }),
  ]);
  res.json({ items, unread });
});

router.post('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
  res.status(204).end();
});

router.post('/:id/read', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'ההתראה לא נמצאה' });
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { $set: { read: true } });
  if (!n) return res.status(404).json({ error: 'ההתראה לא נמצאה' });
  res.status(204).end();
});

export default router;
