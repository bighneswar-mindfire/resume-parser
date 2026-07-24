import { isValidObjectId } from 'mongoose';
import {
  ResumeRepository,
  ResumeFilter,
  ResumePagination,
} from '../repositories/resumeRepository.js';
import { JOB_ROLES } from './roleMatcher.js';

export interface ResumeQuery {
  status?: string;
  keyword?: string;
  location?: string;
  role?: string;
  minScore?: string;
  page?: string;
  limit?: string;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePagination(query: ResumeQuery): ResumePagination {
  const parsedPage = Number(query.page);
  const parsedLimit = Number(query.limit);

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : DEFAULT_PAGE;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return { page, limit };
}

export class UnknownRoleError extends Error {
  constructor(roleName: string) {
    super(`Unknown role "${roleName}". Valid roles: ${JOB_ROLES.map((r) => r.name).join(', ')}`);
    this.name = 'UnknownRoleError';
  }
}

export class InvalidResumeIdError extends Error {
  constructor() {
    super('Invalid resume ID.');
    this.name = 'InvalidResumeIdError';
  }
}

export const ResumeService = {
  async list(query: ResumeQuery) {
    const parsedMinScore = query.minScore !== undefined ? Number(query.minScore) : undefined;

    let normalizedRole = query.role;
    if (parsedMinScore !== undefined && !Number.isNaN(parsedMinScore) && query.role?.trim()) {
      const roleName = query.role.trim();
      const knownRole = JOB_ROLES.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
      if (!knownRole) {
        throw new UnknownRoleError(roleName);
      }
      normalizedRole = knownRole.name;
    }

    const filter: ResumeFilter = {
      status: query.status,
      keyword: query.keyword,
      location: query.location,
      role: normalizedRole,
      minScore: parsedMinScore,
    };

    const pagination = parsePagination(query);
    return ResumeRepository.findMany(filter, pagination);
  },

  async getById(id: string) {
    if (!isValidObjectId(id)) {
      throw new InvalidResumeIdError();
    }
    return ResumeRepository.findById(id);
  },
};
