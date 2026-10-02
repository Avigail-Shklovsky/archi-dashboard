// Vercel serverless entry point: every /api/* request is routed here (see vercel.json)
import { connectDB } from '../server/src/db.js';
import app, { addErrorHandler } from '../server/src/app.js';

addErrorHandler(app);

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'לא ניתן להתחבר למסד הנתונים' });
  }
  return app(req, res);
}
