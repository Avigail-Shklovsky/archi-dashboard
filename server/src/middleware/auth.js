import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { hasAccess, roleOf } from '../access.js';

const isProduction = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET) {
  if (isProduction) throw new Error('JWT_SECRET must be set in production');
  console.warn('JWT_SECRET not set - using an insecure dev secret');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret';

// The token only proves who the user is. The user is re-read from the database on every
// request and the role is derived from the server's configuration - never from the token or the client.
export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    if (!token) return res.status(401).json({ error: 'נדרשת התחברות' });

    let userId;
    try {
      userId = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }).sub;
    } catch {
      return res.status(401).json({ error: 'החיבור פג תוקף, יש להתחבר מחדש' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: 'משתמש לא נמצא' });
    if (!hasAccess(user)) return res.status(403).json({ error: 'אין לחשבון זה הרשאת גישה למערכת' });

    req.user = user;
    req.userId = user._id;
    req.role = roleOf(user.email);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (req.role !== 'admin') return res.status(403).json({ error: 'פעולה זו מותרת למנהלים בלבד' });
  next();
}
