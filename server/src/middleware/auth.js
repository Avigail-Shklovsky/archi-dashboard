import jwt from 'jsonwebtoken';

const isProduction = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET) {
  if (isProduction) throw new Error('JWT_SECRET must be set in production');
  console.warn('JWT_SECRET not set - using an insecure dev secret');
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) return res.status(401).json({ error: 'נדרשת התחברות' });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).sub;
    next();
  } catch {
    res.status(401).json({ error: 'החיבור פג תוקף, יש להתחבר מחדש' });
  }
}
