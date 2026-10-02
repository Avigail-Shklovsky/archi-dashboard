// Vercel Services entry point (see vercel.json): exports the Express app instead of listening.
// Local development and self-hosting use src/index.js.
import express from 'express';
import { connectDB } from './src/db.js';
import api, { addErrorHandler } from './src/app.js';

const app = express();

// Connect once per function instance; later requests reuse the connection
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'לא ניתן להתחבר למסד הנתונים' });
  }
});
app.use(api);
addErrorHandler(app);

export { app };
export default app;
