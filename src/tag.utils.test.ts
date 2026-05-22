import { describe, it, expect } from 'vitest';
import { mergeTags, removeTags, intersectTags, countByTag, topTags, tagIndexToJson } from './tag.utils';
import { tagDiff, buildTagIndex } from './tag';
import { SchemaDiff } from './types';

const makeDiff = (type: SchemaDiff['type'] = 'added'): SchemaDiff => ({
  type, path: 'x', before: undefined, after: undefined
});

describe('mergeTags', () => {
  it('merges without duplicates', () => {
    const t = tagDiff(makeDiff(), ['a', 'b']);
    const result = mergeTags(t, ['b', 'c']);
    expect(result.tags).toEqual(['a', 'b', 'c']);
  });
});

describe('removeTags', () => {
  it('removes specified tags', () => {
    const t = tagDiff(makeDiff(), ['a', 'b', 'c']);
    expect(removeTags(t, ['b']).tags).toEqual(['a', 'c']);
  });
});

describe('intersectTags', () => {
  it('returns only diffs that have all required tags', () => {
    const tagged = [
      tagDiff(makeDiff(), ['a', 'b']),
      tagDiff(makeDiff(), ['a']),
      tagDiff(makeDiff(), ['b', 'c']),
    ];
    const result = intersectTags(tagged, ['a', 'b']);
    expect(result).toHaveLength(1);
    expect(result[0].tags).toContain('a');
    expect(result[0].tags).toContain('b');
  });
});

describe('countByTag', () => {
  it('returns count per tag', () => {
    const index = buildTagIndex([
      tagDiff(makeDiff(), ['x', 'y']),
      tagDiff(makeDiff(), ['x']),
    ]);
    const counts = countByTag(index);
    expect(counts['x']).toBe(2);
    expect(counts['y']).toBe(1);
  });
});

describe('topTags', () => {
  it('returns top N tags by count', () => {
    const index = buildTagIndex([
      tagDiff(makeDiff(), ['a', 'b', 'c']),
      tagDiff(makeDiff(), ['a', 'b']),
      tagDiff(makeDiff(), ['a']),
    ]);
    const top = topTags(index, 2);
    expect(top[0]).toBe('a');
    expect(top).toHaveLength(2);
  });
});

describe('tagIndexToJson', () => {
  it('serializes tag counts as JSON', () => {
    const index = buildTagIndex([tagDiff(makeDiff(), ['foo'])]);
    const json = JSON.parse(tagIndexToJson(index));
    expect(json['foo']).toBe(1);
  });
});
