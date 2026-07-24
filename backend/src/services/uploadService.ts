import { ResumeRepository } from '../repositories/resumeRepository.js';
import { ocrQueue } from '../queues/queueSetup.js';

export interface UploadedFileInput {
  originalname: string;
  path: string;
  mimetype: string;
}

export const UploadService = {
  async ingestFiles(files: UploadedFileInput[]) {
    const savedResumes = [];

    for (const file of files) {
      const savedDoc = await ResumeRepository.create({
        fileName: file.originalname,
        filePath: file.path,
        status: 'PENDING',
      });

      await ocrQueue.add('extract-text', {
        resumeId: savedDoc._id.toString(),
        filePath: file.path,
        mimetype: file.mimetype,
        originalName: file.originalname,
      });

      savedResumes.push(savedDoc);
    }

    return savedResumes;
  },
};
