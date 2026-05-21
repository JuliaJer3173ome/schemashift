import { rankDiff, rankDiffs, formatRanked, RankedDiff } from './rank';
import { SchemaDiff } from './types';

const makeDiff = (path: string, type: SchemaDiff['type'], before?: unknown, after?: unknown): SchemaDiff => ({
  path,
  type,
  before,
  after,
});

describe('rankDiff', () => {
  it('gives higher score to breaking changes', () => {
    const breaking = rankDiff(makeDiff('/properties/id/type', 'changed', 'string', 'integer'));
    const minor = rankDiff(makeDiff('/properties/name/description', 'changed', 'old', 'new'));
    expect(breaking.score).toBeGreaterThan(minor.score);
  });

  it('increases score with path depth', () => {
    const shallow = rankDiff(makeDiff('/type', 'changed', 'object', 'array'));
    const deep = rankDiff(makeDiff('/properties/a/properties/b/type', 'changed', 'string', 'number'));
    expect(deep.score).toBeGreaterThan(shallow.score);
  });

  it('scores removed higher than added', () => {
    const removed = rankDiff(makeDiff('/properties/x', 'removed', { type: 'string' }, undefined));
    const added = rankDiff(makeDiff('/properties/y', 'added', undefined, { type: 'string' }));
    expect(removed.score).toBeGreaterThan(added.score);
  });

  it('includes reason in output', () => {
    const result = rankDiff(makeDiff('/properties/id', 'removed'));
    expect(result.reason).toContain('breaking change');
  });

  it('applies custom weights', () => {
    const d = makeDiff('/type', 'removed');
    const low = rankDiff(d, { breakingWeight: 1 });
    const high = rankDiff(d, { breakingWeight: 100 });
    expect(high.score).toBeGreaterThan(low.score);
  });
});

describe('rankDiffs', () => {
  it('returns diffs sorted by score descending', () => {
    const diffs = [
      makeDiff('/properties/a/description', 'changed', 'x', 'y'),
      makeDiff('/properties/b/type', 'removed', 'string', undefined),
      makeDiff('/properties/c', 'added', undefined, {}),
    ];
    const ranked = rankDiffs(diffs);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[1].score).toBeGreaterThanOrEqual(ranked[2].score);
  });

  it('returns empty array for no diffs', () => {
    expect(rankDiffs([])).toEqual([]);
  });
});

describe('formatRanked', () => {
  it('returns message for empty list', () => {
    expect(formatRanked([])).toBe('No changes to rank.');
  });

  it('formats ranked diffs with index and score', () => {
    const ranked: RankedDiff[] = [
      { diff: makeDiff('/type', 'removed'), score: 15, reason: 'breaking change' },
      { diff: makeDiff('/properties/x', 'added'), score: 3, reason: 'new field' },
    ];
    const output = formatRanked(ranked);
    expect(output).toContain('#1');
    expect(output).toContain('score: 15');
    expect(output).toContain('#2');
    expect(output).toContain('new field');
  });
});
