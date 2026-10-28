import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { JWT_SECRET, requireAuth } from '../middleware/auth.js';
import { hasAccess, isAdminEmail } from '../access.js';

const router = Router();
const googleClient = new OAuth2Client();
const signToken = (user) => jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '30d' });

// Sign in with the ID token returned by the Google sign-in button.
// Only admins (ADMIN_EMAILS) and people an admin added to the team get in; nobody else gets an account.
router.post('/google', async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim(); // tolerate stray whitespace pasted into the env var
  if (!clientId) return res.status(500).json({ error: 'התחברות עם Google לא הוגדרה בשרת' });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential || '',
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: 'ההתחברות עם Google נכשלה, נסו שוב' });
  }

  const email = payload.email?.toLowerCase();
  if (!email || !payload.email_verified) return res.status(401).json({ error: 'חשבון ה-Google אינו מאומת' });

  // The email is verified by Google, so it identifies the person the admin added
  let user = await User.findOne({ email });
  if (!user && isAdminEmail(email)) user = new User({ email, name: payload.name || email });
  if (!hasAccess(user)) {
    return res.status(403).json({ error: 'החשבון הזה לא נוסף למערכת. יש לפנות למנהל.' });
  }
  user.set({ googleId: payload.sub, picture: payload.picture || '' }); // keep the name the admin entered
  await user.save();

  res.json({ token: signToken(user), user });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
