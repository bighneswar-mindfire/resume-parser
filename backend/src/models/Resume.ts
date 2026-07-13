import { Schema, model, Document } from 'mongoose';

export interface IResume extends Document {
  fileName: string;
  filePath: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  rawText?: string;
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience?: number;
  education?: Array<{ school: string; degree: string; year: number }>;
  matchedRoles?: Array<{ roleName: string; score: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    errorMessage: { type: String },
    rawText: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    skills: { type: [String], default: [] },
    experience: { type: Number },
    education: [
      {
        school: String,
        degree: String,
        year: Number,
      },
    ],
    matchedRoles: [
      {
        roleName: String,
        score: Number,
      },
    ],
  },
  { timestamps: true }
);

export const Resume = model<IResume>('Resume', ResumeSchema);
