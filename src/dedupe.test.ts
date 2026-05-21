import { dedupeDiffs, mergeDuplicates, countDuplicates, dedupeKey } from './dedupe';
import { SchemaDiff } from './types';

const addDiff: SchemaDiff = { type: 'add', path: 'properties.name', before: undefined, after: { type: 'string' } };
const removeDiff: SchemaDiff = { type: 'remove', path: 'properties.age', before: { type: 'number' }, after: undefined };
const changeDiff: SchemaDiff = { type: 'change', path: 'properties.email', before: { type: 'string' }, after: { type: 'string', format: 'email' } };

describe('dedupeKey', () => {
  it('returns a consistent string key for a diff', () => {
    const key = dedupeKey(addDiff);
    expect(typeof key).toBe('string');
    expect(key).toContain('add');
    expect(key).toContain('properties.name');
  });

  it('returns different keys for different diffs', () => {
    expect(dedupeKey(addDiff)).not.toBe(dedupeKey(removeDiff));
  });
});

describe('dedupeDiffs', () => {
  it('returns same list when no duplicates', () => {
    const diffs = [addDiff, removeDiff, changeDiff];
    expect(dedupeDiffs(diffs)).toHaveLength(3);
  });

  it('removes exact duplicate diffs', () => {
    const diffs = [addDiff, addDiff, removeDiff];
    const result = dedupeDiffs(diffs);
    expect(result).toHaveLength(2);
  });

  it('preserves order of first occurrence', () => {
    const diffs = [changeDiff, addDiff, changeDiff];
    const result = dedupeDiffs(diffs);
    expect(result[0]).toEqual(changeDiff);
    expect(result[1]).toEqual(addDiff);
  });

  it('returns empty array for empty input', () => {
    expect(dedupeDiffs([])).toEqual([]);
  });
});

describe('mergeDuplicates', () => {
  it('collapses add+remove on same path into a change', () => {
    const add: SchemaDiff = { type: 'add', path: 'properties.x', before: undefined, after: { type: 'integer' } };
    const remove: SchemaDiff = { type: 'remove', path: 'properties.x', before: { type: 'string' }, after: undefined };
    const result = mergeDuplicates([remove, add]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('change');
    expect(result[0].before).toEqual({ type: 'string' });
    expect(result[0].after).toEqual({ type: 'integer' });
  });

  it('keeps last diff when same path and same type', () => {
    const first: SchemaDiff = { type: 'change', path: 'properties.y', before: { type: 'string' }, after: { type: 'number' } };
    const second: SchemaDiff = { type: 'change', path: 'properties.y', before: { type: 'number' }, after: { type: 'boolean' } };
    const result = mergeDuplicates([first, second]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(second);
  });

  it('returns unchanged list when all paths are unique', () => {
    const diffs = [addDiff, removeDiff, changeDiff];
    expect(mergeDuplicates(diffs)).toHaveLength(3);
  });
});

describe('countDuplicates', () => {
  it('returns 0 when no duplicates', () => {
    expect(countDuplicates([addDiff, removeDiff])).toBe(0);
  });

  it('counts exact duplicates correctly', () => {
    expect(countDuplicates([addDiff, addDiff, addDiff])).toBe(2);
  });

  it('returns 0 for empty input', () => {
    expect(countDuplicates([])).toBe(0);
  });
});
