import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import upload from '../config/multer.js';
import { Resume } from '../models/Resume.js';
import { NlpParserService } from '../services/nlpParser.js';
import { OcrService } from '../services/ocrService.js';
const router: Router = express.Router();

router.post(
  '/upload',
  upload.array('resumes', 10),
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one file.' });
      }

      const savedResumes = [];

      for (const file of files) {
        let rawText = '';

        //PDF
        if (file.mimetype === 'application/pdf') {
          const dataBuffer = fs.readFileSync(file.path);
          const parser = new PDFParse({ data: dataBuffer });
          try {
            const parsedPdf = await parser.getText();
            rawText = parsedPdf.text;
          } catch (pdfError) {
            console.error(`Failed to extract text from PDF: ${file.originalname}`, pdfError);
            rawText = 'Error extracting text from file.';
          } finally {
            await parser.destroy();
          }
        }
        //Image
        else if (file.mimetype.startsWith('image/')) {
          try {
            console.log(`Executing OCR processing on: ${file.originalname}...`);
            rawText = await OcrService.extractTextFromImage(file.path);
          } catch (ocrError) {
            console.error(`OCR processing failed for: ${file.originalname}`, ocrError);
            rawText = 'Error executing OCR on image file.';
          }
        }
        //TXT
        else {
          rawText = fs.readFileSync(file.path, 'utf-8');
        }

        const parsedFields = NlpParserService.parse(rawText);

        //Save in db
        const newResume = new Resume({
          fileName: file.originalname,
          filePath: file.path,
          status: 'COMPLETED',
          rawText,
          name: parsedFields.name,
          email: parsedFields.email,
          phone: parsedFields.phone,
          skills: parsedFields.skills,
          experience: parsedFields.experience,
          education: parsedFields.education,
        });

        const savedDoc = await newResume.save();
        savedResumes.push(savedDoc);
      }

      return res.status(200).json({
        message: 'Files uploaded, processed, and parsed successfully.',
        data: savedResumes,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return res
        .status(500)
        .json({ error: 'Server error during parsing pipeline.', details: errorMessage });
    }
  }
);

router.use((err: Error, req: Request, res: Response, next: NextFunction): Response | void => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer Error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
