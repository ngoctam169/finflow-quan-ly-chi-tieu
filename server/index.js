import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';
import { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3002;

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.listen(PORT, async () => {
  const mode = await initDb();
  console.log(`🚀 FinFlow VN API Server running on http://localhost:${PORT} (DB mode: ${mode})`);
});
