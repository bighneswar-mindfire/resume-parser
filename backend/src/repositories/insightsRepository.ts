import { InsightsSummary, IInsightsSummary } from '../models/InsightsSummary.js';
import { Resume } from '../models/Resume.js';

export const InsightsRepository = {
  async countTotal(): Promise<number> {
    return Resume.countDocuments();
  },

  async countFailed(): Promise<number> {
    return Resume.countDocuments({ status: 'FAILED' });
  },

  async findCompleted() {
    return Resume.find(
      { status: 'COMPLETED' },
      { skills: 1, experience: 1, education: 1, matchedRoles: 1 }
    ).lean();
  },

  async getSnapshot(): Promise<IInsightsSummary | null> {
    return InsightsSummary.findOne({ key: 'global' }).lean() as Promise<IInsightsSummary | null>;
  },

  async upsertSnapshot(payload: Record<string, unknown>): Promise<void> {
    await InsightsSummary.findOneAndUpdate({ key: 'global' }, payload, { upsert: true });
  },
};
