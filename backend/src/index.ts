import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import uploadRouter from './routes/upload.js';
import resumesRouter from './routes/resumes.js';
import insightsRouter from './routes/insights.js';
import { requireAuth } from './middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());

connectDB();

if (process.env.WORKERS_ENABLED !== 'false') {
  await import('./workers/ocrWorker.js');
  await import('./workers/parserWorker.js');
  await import('./workers/insightsWorker.js');
}

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

const auth = requireAuth({
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
});

app.use('/api', auth, uploadRouter);
app.use('/api', auth, resumesRouter);
app.use('/api', auth, insightsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
