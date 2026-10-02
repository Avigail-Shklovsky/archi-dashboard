// Local / self-hosted entry point. On Vercel, api/index.js is used instead.
import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import { connectDB } from './db.js';
import app, { addErrorHandler } from './app.js';

// In production, serve the built React app
const clientDist = path.resolve('../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}
addErrorHandler(app);

// Dev always uses 4000 (the Vite proxy target); production honours PORT from the host
const PORT = process.argv.includes('--dev') ? 4000 : process.env.PORT || 4000;
await connectDB();
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
