import { isValidObjectId } from 'mongoose';
import { ResumeRepository, ResumeFilter } from '../repositories/resumeRepository.js';
import { JOB_ROLES } from './roleMatcher.js';

export interface ResumeQuery {
  status?: string;
  keyword?: string;
  location?: string;
  role?: string;
  minScore?: string;
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

    return ResumeRepository.findMany(filter);
  },

  async getById(id: string) {
    if (!isValidObjectId(id)) {
      throw new InvalidResumeIdError();
    }
    return ResumeRepository.findById(id);
  },
};
