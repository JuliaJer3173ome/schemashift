import { searchSchema, searchDiff, formatSearchResults } from './search';
import { JSONSchema, DiffResult } from './types';

const schema: JSONSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', description: 'The user login name' },
    email: { type: 'string', description: 'User email address' },
    age: { type: 'integer' },
    role: { type: 'string', enum: ['admin', 'user', 'guest'] },
  },
  required: ['username', 'email'],
};

const diffs: DiffResult[] = [
  { path: 'properties.username.type', type: 'modified', before: 'string', after: 'integer' },
  { path: 'properties.email.description', type: 'added', before: undefined, after: 'email field' },
  { path: 'properties.age', type: 'removed', before: { type: 'integer' }, after: undefined },
];

describe('searchSchema', () => {
  it('finds by property name', () => {
    const results = searchSchema(schema, 'username');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].path).toContain('username');
  });

  it('finds by type', () => {
    const results = searchSchema(schema, 'integer');
    expect(results.some((r) => r.type === 'type')).toBe(true);
  });

  it('finds by description partial match', () => {
    const results = searchSchema(schema, 'email');
    expect(results.length).toBeGreaterThan(0);
  });

  it('respects caseSensitive option', () => {
    const sensitive = searchSchema(schema, 'USERNAME', { caseSensitive: true });
    const insensitive = searchSchema(schema, 'USERNAME', { caseSensitive: false });
    expect(sensitive.length).toBe(0);
    expect(insensitive.length).toBeGreaterThan(0);
  });

  it('respects maxResults', () => {
    const results = searchSchema(schema, 'e', { maxResults: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('returns empty array when no match', () => {
    const results = searchSchema(schema, 'nonexistentxyz');
    expect(results).toEqual([]);
  });

  it('finds enum values', () => {
    const results = searchSchema(schema, 'admin');
    expect(results.some((r) => r.type === 'enum')).toBe(true);
  });
});

describe('searchDiff', () => {
  it('filters diffs by path query', () => {
    const results = searchDiff(diffs, 'username');
    expect(results).toHaveLength(1);
    expect(results[0].path).toContain('username');
  });

  it('returns multiple matches', () => {
    const results = searchDiff(diffs, 'properties');
    expect(results.length).toBe(3);
  });

  it('returns empty for no match', () => {
    expect(searchDiff(diffs, 'zzznope')).toEqual([]);
  });
});

describe('formatSearchResults', () => {
  it('returns no-results message for empty array', () => {
    expect(formatSearchResults([])).toBe('No results found.');
  });

  it('formats matches with path, type and score', () => {
    const results = searchSchema(schema, 'username');
    const output = formatSearchResults(results);
    expect(output).toContain('username');
    expect(output).toContain('score:');
  });
});
