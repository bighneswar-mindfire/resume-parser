import { Schema, model, Document } from 'mongoose';

export interface IInsightsSummary extends Document {
  key: string;
  totalResumes: number;
  completedResumes: number;
  failedResumes: number;
  avgExperience: number;
  topSkills: Array<{ skill: string; count: number }>;
  topUniversities: Array<{ school: string; count: number }>;
  experienceBuckets: Array<{ range: string; count: number }>;
  roleScores: Array<{ roleName: string; avgScore: number; strongMatches: number }>;
  computedAt: Date;
}

const InsightsSummarySchema = new Schema<IInsightsSummary>({
  key: { type: String, required: true, unique: true, default: 'global' },
  totalResumes: { type: Number, default: 0 },
  completedResumes: { type: Number, default: 0 },
  failedResumes: { type: Number, default: 0 },
  avgExperience: { type: Number, default: 0 },
  topSkills: [{ skill: String, count: Number, _id: false }],
  topUniversities: [{ school: String, count: Number, _id: false }],
  experienceBuckets: [{ range: String, count: Number, _id: false }],
  roleScores: [{ roleName: String, avgScore: Number, strongMatches: Number, _id: false }],
  computedAt: { type: Date, required: true },
});

export const InsightsSummary = model<IInsightsSummary>('InsightsSummary', InsightsSummarySchema);
