import { isValidObjectId, QueryFilter } from 'mongoose';
import { Resume, IResume } from '../models/Resume.js';

export interface ResumeFilter {
  status?: string;
  keyword?: string;
  location?: string;
  role?: string;
  minScore?: number;
}

export interface ResumePagination {
  page: number;
  limit: number;
}

export interface PaginatedResumes<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

function escapeRegex(value: string): string {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export const ResumeRepository = {
  async findMany(filter: ResumeFilter, pagination: ResumePagination) {
    const conditions: QueryFilter<IResume>[] = [];

    if (filter.status) {
      conditions.push({ status: filter.status.toUpperCase() as IResume['status'] });
    }

    if (filter.keyword?.trim()) {
      const pattern = new RegExp(escapeRegex(filter.keyword.trim()), 'i');
      conditions.push({
        $or: [{ name: pattern }, { email: pattern }, { skills: pattern }, { rawText: pattern }],
      });
    }

    if (filter.location?.trim()) {
      conditions.push({ rawText: new RegExp(escapeRegex(filter.location.trim()), 'i') });
    }

    if (filter.minScore !== undefined && !Number.isNaN(filter.minScore)) {
      if (filter.role?.trim()) {
        conditions.push({
          matchedRoles: {
            $elemMatch: { roleName: filter.role.trim(), score: { $gte: filter.minScore } },
          },
        });
      } else {
        conditions.push({ 'matchedRoles.score': { $gte: filter.minScore } });
      }
    } else if (filter.role?.trim()) {
      conditions.push({
        matchedRoles: { $elemMatch: { roleName: filter.role.trim(), score: { $gt: 0 } } },
      });
    }

    const query: QueryFilter<IResume> = conditions.length > 0 ? { $and: conditions } : {};
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      Resume.find(query, { rawText: 0, filePath: 0 })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      Resume.countDocuments(query),
    ]);

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  async findById(id: string) {
    if (!isValidObjectId(id)) return null;
    return Resume.findById(id, { rawText: 0, filePath: 0 }).lean();
  },

  async create(data: { fileName: string; filePath: string; status: string }) {
    const resume = new Resume(data);
    return resume.save();
  },
};
