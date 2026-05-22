import { describe, it, expect } from 'vitest';
import {
  tagDiff, tagDiffs, buildTagIndex, filterByTag,
  listTags, autoTag, formatTagSummary
} from './tag';
import { SchemaDiff } from './types';

const makeDiff = (type: SchemaDiff['type'], path = 'a'): SchemaDiff => ({
  type, path, before: undefined, after: undefined
});

describe('tagDiff', () => {
  it('normalizes tags to lowercase', () => {
    const result = tagDiff(makeDiff('added'), ['FOO', 'Bar']);
    expect(result.tags).toEqual(['foo', 'bar']);
  });

  it('filters empty tags', () => {
    const result = tagDiff(makeDiff('added'), ['', '  ', 'ok']);
    expect(result.tags).toEqual(['ok']);
  });
});

describe('tagDiffs', () => {
  it('applies tagger to each diff', () => {
    const diffs = [makeDiff('added'), makeDiff('removed')];
    const result = tagDiffs(diffs, d => [d.type]);
    expect(result[0].tags).toEqual(['added']);
    expect(result[1].tags).toEqual(['removed']);
  });
});

describe('buildTagIndex', () => {
  it('indexes diffs by tag', () => {
    const tagged = [
      tagDiff(makeDiff('added', 'x'), ['alpha', 'beta']),
      tagDiff(makeDiff('removed', 'y'), ['alpha']),
    ];
    const index = buildTagIndex(tagged);
    expect(index['alpha']).toHaveLength(2);
    expect(index['beta']).toHaveLength(1);
  });
});

describe('filterByTag', () => {
  it('returns diffs matching a tag', () => {
    const tagged = [
      tagDiff(makeDiff('added'), ['foo']),
      tagDiff(makeDiff('removed'), ['bar']),
    ];
    expect(filterByTag(tagged, 'foo')).toHaveLength(1);
    expect(filterByTag(tagged, 'bar')).toHaveLength(1);
    expect(filterByTag(tagged, 'baz')).toHaveLength(0);
  });
});

describe('listTags', () => {
  it('returns sorted unique tags', () => {
    const tagged = [
      tagDiff(makeDiff('added'), ['b', 'a']),
      tagDiff(makeDiff('removed'), ['a', 'c']),
    ];
    expect(listTags(tagged)).toEqual(['a', 'b', 'c']);
  });
});

describe('autoTag', () => {
  it('includes diff type as tag', () => {
    expect(autoTag(makeDiff('added', 'x'))).toContain('added');
  });

  it('adds property tag for properties path', () => {
    expect(autoTag(makeDiff('changed', 'properties.name'))).toContain('property');
  });

  it('adds breaking-candidate for removed/changed', () => {
    expect(autoTag(makeDiff('removed', 'x'))).toContain('breaking-candidate');
  });
});

describe('formatTagSummary', () => {
  it('formats tag counts', () => {
    const index = buildTagIndex([tagDiff(makeDiff('added'), ['foo', 'bar'])]);
    const out = formatTagSummary(index);
    expect(out).toContain('[bar]');
    expect(out).toContain('[foo]');
  });
});
