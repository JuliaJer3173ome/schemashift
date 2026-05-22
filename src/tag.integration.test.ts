import { describe, it, expect } from 'vitest';
import { diffSchemas } from './diff';
import { tagDiffs, buildTagIndex, autoTag, filterByTag, listTags, formatTagSummary } from './tag';
import { topTags } from './tag.utils';

const schemaA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['name'],
};

const schemaB = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string' },
  },
  required: ['name', 'email'],
};

describe('tag integration', () => {
  it('auto-tags real diffs from schema comparison', () => {
    const diffs = diffSchemas(schemaA, schemaB);
    const tagged = tagDiffs(diffs, autoTag);
    expect(tagged.length).toBeGreaterThan(0);
    const tags = listTags(tagged);
    expect(tags).toContain('property');
  });

  it('builds a tag index from real diffs', () => {
    const diffs = diffSchemas(schemaA, schemaB);
    const tagged = tagDiffs(diffs, autoTag);
    const index = buildTagIndex(tagged);
    expect(Object.keys(index).length).toBeGreaterThan(0);
  });

  it('filters diffs by breaking-candidate tag', () => {
    const diffs = diffSchemas(schemaA, schemaB);
    const tagged = tagDiffs(diffs, autoTag);
    const breaking = filterByTag(tagged, 'breaking-candidate');
    expect(breaking.length).toBeGreaterThan(0);
  });

  it('formats a tag summary for real diffs', () => {
    const diffs = diffSchemas(schemaA, schemaB);
    const tagged = tagDiffs(diffs, autoTag);
    const index = buildTagIndex(tagged);
    const summary = formatTagSummary(index);
    expect(summary).toContain('change(s)');
  });

  it('returns top tags by frequency', () => {
    const diffs = diffSchemas(schemaA, schemaB);
    const tagged = tagDiffs(diffs, autoTag);
    const index = buildTagIndex(tagged);
    const top = topTags(index, 3);
    expect(top.length).toBeGreaterThan(0);
  });
});
