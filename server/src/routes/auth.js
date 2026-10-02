import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client();
const signToken = (user) => jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '30d' });

// Optional allow-list, e.g. "a@gmail.com,b@office.co.il" or "@office.co.il" for a whole domain
function isAllowed(email) {
  const list = (process.env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!list.length) return true;
  return list.some((entry) => (entry.startsWith('@') ? email.endsWith(entry) : email === entry));
}

// Sign in (or sign up) with the ID token returned by the Google sign-in button
router.post('/google', async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'התחברות עם Google לא הוגדרה בשרת' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential || '',
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'ההתחברות עם Google נכשלה, נסו שוב' });
  }

  const email = payload.email?.toLowerCase();
  if (!email || !payload.email_verified) return res.status(401).json({ error: 'חשבון ה-Google אינו מאומת' });
  if (!isAllowed(email)) return res.status(403).json({ error: 'אין לחשבון זה הרשאת גישה למערכת' });

  // Match by Google id, or link an existing account with the same email
  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
  if (!user) user = new User({ email });
  user.set({
    googleId: payload.sub,
    name: user.name || payload.name || email,
    picture: payload.picture || '',
  });
  await user.save();

  res.json({ token: signToken(user), user });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'משתמש לא נמצא' });
  res.json({ user });
});

export default router;
