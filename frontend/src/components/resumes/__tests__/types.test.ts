import { describe, it, expect } from 'vitest';
import { buildQueryString, EMPTY_FILTERS, Filters } from '../types';

describe('buildQueryString', () => {
  it('returns an empty string when no filters are set', () => {
    expect(buildQueryString(EMPTY_FILTERS)).toBe('');
  });

  it('ignores whitespace-only keyword and location', () => {
    const filters: Filters = { keyword: '   ', location: '  ', role: '', minScore: '' };
    expect(buildQueryString(filters)).toBe('');
  });

  it('trims keyword and location values', () => {
    const filters: Filters = {
      keyword: '  react  ',
      location: '  new york ',
      role: '',
      minScore: '',
    };
    const qs = buildQueryString(filters);
    const params = new URLSearchParams(qs);
    expect(params.get('keyword')).toBe('react');
    expect(params.get('location')).toBe('new york');
  });

  it('includes role and minScore when provided', () => {
    const filters: Filters = {
      keyword: '',
      location: '',
      role: 'Frontend Developer',
      minScore: '70',
    };
    const params = new URLSearchParams(buildQueryString(filters));
    expect(params.get('role')).toBe('Frontend Developer');
    expect(params.get('minScore')).toBe('70');
  });

  it('prefixes the query string with a question mark when non-empty', () => {
    const filters: Filters = { keyword: 'node', location: '', role: '', minScore: '' };
    expect(buildQueryString(filters).startsWith('?')).toBe(true);
  });

  it('combines multiple filters into one query string', () => {
    const filters: Filters = {
      keyword: 'react',
      location: 'boston',
      role: 'Backend Developer',
      minScore: '50',
    };
    const params = new URLSearchParams(buildQueryString(filters));
    expect(params.get('keyword')).toBe('react');
    expect(params.get('location')).toBe('boston');
    expect(params.get('role')).toBe('Backend Developer');
    expect(params.get('minScore')).toBe('50');
  });

  it('appends page and limit when pagination is supplied', () => {
    const params = new URLSearchParams(buildQueryString(EMPTY_FILTERS, { page: 2, limit: 25 }));
    expect(params.get('page')).toBe('2');
    expect(params.get('limit')).toBe('25');
  });

  it('combines filters with pagination params', () => {
    const filters: Filters = { keyword: 'react', location: '', role: '', minScore: '' };
    const params = new URLSearchParams(buildQueryString(filters, { page: 3, limit: 10 }));
    expect(params.get('keyword')).toBe('react');
    expect(params.get('page')).toBe('3');
    expect(params.get('limit')).toBe('10');
  });
});
