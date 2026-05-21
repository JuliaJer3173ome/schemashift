import { describe, it, expect } from 'vitest';
import { diffSchemas } from './diff';
import { classifyDiffs, groupByCategory, formatClassification } from './classify';

describe('classify integration', () => {
  it('classifies a realistic schema diff end-to-end', () => {
    const before = {
      type: 'object',
      title: 'User',
      properties: {
        age: { type: 'integer', minimum: 0 },
        name: { type: 'string', description: 'Full name' },
      },
      required: ['name'],
    };

    const after = {
      type: 'object',
      title: 'UserProfile',
      properties: {
        age: { type: 'integer', minimum: 18 },
        name: { type: 'string', description: 'Display name' },
        email: { type: 'string' },
      },
      required: ['name', 'email'],
    };

    const diffs = diffSchemas(before, after);
    expect(diffs.length).toBeGreaterThan(0);

    const classified = classifyDiffs(diffs);
    const grouped = groupByCategory(classified);

    // title change → metadata
    expect(grouped.metadata.some(c => c.diff.path.includes('title'))).toBe(true);

    // minimum change → constraint
    expect(grouped.constraint.some(c => c.diff.path.includes('minimum'))).toBe(true);

    // required change → structural
    expect(grouped.structural.some(c => c.diff.path.includes('required'))).toBe(true);
  });

  it('formatClassification output contains all changed categories', () => {
    const before = { type: 'string', minLength: 1, title: 'Old' };
    const after = { type: 'number', maxLength: 100, title: 'New' };

    const diffs = diffSchemas(before, after);
    const classified = classifyDiffs(diffs);
    const report = formatClassification(classified);

    expect(report).toContain('Type');
    expect(report).toContain('Metadata');
    expect(report).toContain('Constraint');
  });

  it('returns empty groups when schemas are identical', () => {
    const schema = { type: 'string', title: 'Same' };
    const diffs = diffSchemas(schema, schema);
    const classified = classifyDiffs(diffs);
    expect(classified).toHaveLength(0);
  });
});
