import { diffSchemas } from './diff';
import { rankDiffs, formatRanked } from './rank';

describe('rank integration', () => {
  it('ranks diffs from a real schema diff', () => {
    const before = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string', description: 'User name' },
        role: { type: 'string' },
      },
      required: ['id'],
    };
    const after = {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', description: 'Full name' },
        email: { type: 'string' },
      },
      required: ['id', 'email'],
    };

    const diffs = diffSchemas(before, after);
    const ranked = rankDiffs(diffs);

    expect(ranked.length).toBeGreaterThan(0);
    // Highest ranked should be a breaking or significant change
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[ranked.length - 1].score);
  });

  it('produces readable formatted output', () => {
    const before = { type: 'object', properties: { x: { type: 'string' } } };
    const after = { type: 'object', properties: { x: { type: 'number' } } };

    const diffs = diffSchemas(before, after);
    const ranked = rankDiffs(diffs);
    const output = formatRanked(ranked);

    expect(typeof output).toBe('string');
    expect(output).toContain('#1');
    expect(output).toContain('score:');
  });

  it('handles schema with no changes', () => {
    const schema = { type: 'object', properties: { a: { type: 'string' } } };
    const diffs = diffSchemas(schema, schema);
    const ranked = rankDiffs(diffs);
    expect(ranked).toHaveLength(0);
    expect(formatRanked(ranked)).toBe('No changes to rank.');
  });
});
