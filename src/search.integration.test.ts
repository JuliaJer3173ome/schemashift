import { searchSchema, searchDiff, formatSearchResults } from './search';
import { diffSchemas } from './diff';
import { JSONSchema } from './types';

const schemaV1: JSONSchema = {
  type: 'object',
  description: 'User profile schema',
  properties: {
    id: { type: 'integer', description: 'Unique identifier' },
    name: { type: 'string', description: 'Full name of the user' },
    email: { type: 'string', description: 'Contact email address' },
    status: { type: 'string', enum: ['active', 'inactive', 'banned'] },
  },
  required: ['id', 'name'],
};

const schemaV2: JSONSchema = {
  type: 'object',
  description: 'User profile schema v2',
  properties: {
    id: { type: 'string', description: 'Unique identifier (UUID)' },
    name: { type: 'string', description: 'Full name of the user' },
    email: { type: 'string', description: 'Primary contact email' },
    role: { type: 'string', enum: ['admin', 'member', 'guest'] },
  },
  required: ['id', 'name', 'email'],
};

describe('search integration', () => {
  it('finds changed fields by searching diff results', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const matches = searchDiff(diffs, 'id');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.path.includes('id'))).toBe(true);
  });

  it('locates schema nodes by description keyword', () => {
    const results = searchSchema(schemaV2, 'UUID');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('description');
  });

  it('finds removed enum values via diff search', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const statusDiffs = searchDiff(diffs, 'status');
    expect(statusDiffs.length).toBeGreaterThan(0);
  });

  it('formats search results from a real schema search', () => {
    const results = searchSchema(schemaV1, 'email');
    const output = formatSearchResults(results);
    expect(output).toContain('email');
    expect(output).not.toBe('No results found.');
  });

  it('full pipeline: diff then search diffs by path segment', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const roleChanges = searchDiff(diffs, 'role');
    const statusChanges = searchDiff(diffs, 'status');
    expect(roleChanges.length + statusChanges.length).toBeGreaterThan(0);
  });
});
