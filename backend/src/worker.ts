import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

dotenv.config();

await connectDB();

await import('./workers/ocrWorker.js');
await import('./workers/parserWorker.js');
await import('./workers/insightsWorker.js');

console.log('[Worker] OCR, parser, and insights workers running.');
