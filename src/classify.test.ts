import { describe, it, expect } from 'vitest';
import {
  classifyChange,
  classifyDiffs,
  groupByCategory,
  formatClassification,
} from './classify';
import { SchemaDiff } from './types';

const makeDiff = (path: string, type: SchemaDiff['type'] = 'changed'): SchemaDiff => ({
  path,
  type,
  before: 'a',
  after: 'b',
});

describe('classifyChange', () => {
  it('classifies type changes as type/high', () => {
    const result = classifyChange(makeDiff('root.type'));
    expect(result.category).toBe('type');
    expect(result.severity).toBe('high');
  });

  it('classifies description as metadata/low', () => {
    const result = classifyChange(makeDiff('root.description'));
    expect(result.category).toBe('metadata');
    expect(result.severity).toBe('low');
  });

  it('classifies minimum as constraint/high when added', () => {
    const result = classifyChange(makeDiff('root.minimum', 'added'));
    expect(result.category).toBe('constraint');
    expect(result.severity).toBe('high');
  });

  it('classifies minimum as constraint/medium when removed', () => {
    const result = classifyChange(makeDiff('root.minimum', 'removed'));
    expect(result.category).toBe('constraint');
    expect(result.severity).toBe('medium');
  });

  it('classifies required as structural/high', () => {
    const result = classifyChange(makeDiff('root.required'));
    expect(result.category).toBe('structural');
    expect(result.severity).toBe('high');
  });

  it('classifies unknown keys as unknown/medium', () => {
    const result = classifyChange(makeDiff('root.someCustomKey'));
    expect(result.category).toBe('unknown');
    expect(result.severity).toBe('medium');
  });
});

describe('classifyDiffs', () => {
  it('returns classified entry for each diff', () => {
    const diffs = [makeDiff('root.type'), makeDiff('root.title')];
    const result = classifyDiffs(diffs);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('type');
    expect(result[1].category).toBe('metadata');
  });
});

describe('groupByCategory', () => {
  it('groups classified diffs by category', () => {
    const classified = classifyDiffs([makeDiff('root.type'), makeDiff('root.title'), makeDiff('root.required')]);
    const groups = groupByCategory(classified);
    expect(groups.type).toHaveLength(1);
    expect(groups.metadata).toHaveLength(1);
    expect(groups.structural).toHaveLength(1);
    expect(groups.constraint).toHaveLength(0);
  });
});

describe('formatClassification', () => {
  it('produces a markdown-style report', () => {
    const classified = classifyDiffs([makeDiff('root.type'), makeDiff('root.title')]);
    const output = formatClassification(classified);
    expect(output).toContain('## Change Classification');
    expect(output).toContain('Type');
    expect(output).toContain('Metadata');
    expect(output).toContain('[HIGH]');
    expect(output).toContain('[LOW]');
  });

  it('omits empty categories', () => {
    const classified = classifyDiffs([makeDiff('root.type')]);
    const output = formatClassification(classified);
    expect(output).not.toContain('Constraint');
  });
});
