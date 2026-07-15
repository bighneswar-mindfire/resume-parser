import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import uploadRouter from './routes/upload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

connectDB();

import './workers/ocrWorker.js';
import './workers/parserWorker.js';

app.use('/api', uploadRouter);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
