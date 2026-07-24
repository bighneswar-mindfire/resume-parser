import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { savedDocs, addToQueue } = vi.hoisted(() => ({
  savedDocs: [] as Array<{ _id: string; fileName: string; filePath: string; status: string }>,
  addToQueue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../repositories/resumeRepository.js', () => ({
  ResumeRepository: {
    create: vi
      .fn()
      .mockImplementation((input: { fileName: string; filePath: string; status: string }) => {
        const doc = {
          _id: `resume-${savedDocs.length + 1}`,
          fileName: input.fileName,
          filePath: input.filePath,
          status: input.status,
        };
        savedDocs.push(doc);
        return Promise.resolve({ ...doc, _id: { toString: () => doc._id } });
      }),
  },
}));

vi.mock('../../queues/queueSetup.js', () => ({
  ocrQueue: { add: addToQueue },
}));

import uploadRouter from '../upload.js';

function buildApp() {
  const app = express();
  app.use('/api', uploadRouter);
  return app;
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    savedDocs.length = 0;
    addToQueue.mockClear();
  });

  it('returns 400 when no files were included in the request', async () => {
    const res = await request(buildApp()).post('/api/upload');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one file/i);
    expect(addToQueue).not.toHaveBeenCalled();
  });

  it('rejects an unsupported file type via the multer fileFilter', async () => {
    const res = await request(buildApp())
      .post('/api/upload')
      .attach('resumes', Buffer.from('hello world'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid file type/i);
    expect(savedDocs).toHaveLength(0);
  });

  it('accepts a PDF, persists a placeholder resume and queues an OCR job', async () => {
    const pdfBuffer = Buffer.from('%PDF-1.4 fake');

    const res = await request(buildApp())
      .post('/api/upload')
      .attach('resumes', pdfBuffer, { filename: 'jane.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(202);
    expect(res.body.message).toMatch(/successfully uploaded/i);
    expect(res.body.data).toHaveLength(1);

    expect(savedDocs).toHaveLength(1);
    expect(savedDocs[0]).toMatchObject({ fileName: 'jane.pdf', status: 'PENDING' });

    expect(addToQueue).toHaveBeenCalledTimes(1);
    const [jobName, jobData] = addToQueue.mock.calls[0]!;
    expect(jobName).toBe('extract-text');
    expect(jobData).toMatchObject({
      resumeId: expect.any(String),
      mimetype: 'application/pdf',
      originalName: 'jane.pdf',
    });
  });

  it('processes multiple files in a single upload', async () => {
    const pdf = Buffer.from('%PDF-1.4');
    const png = Buffer.from([137, 80, 78, 71]);

    const res = await request(buildApp())
      .post('/api/upload')
      .attach('resumes', pdf, { filename: 'a.pdf', contentType: 'application/pdf' })
      .attach('resumes', png, { filename: 'b.png', contentType: 'image/png' });

    expect(res.status).toBe(202);
    expect(savedDocs).toHaveLength(2);
    expect(addToQueue).toHaveBeenCalledTimes(2);
  });
});
