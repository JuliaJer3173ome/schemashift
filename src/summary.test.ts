import { summarizeDiff, formatSummary } from './summary';
import { SchemaDiff } from './types';

const mockDiffs: SchemaDiff[] = [
  { path: 'properties.name', type: 'added', oldValue: undefined, newValue: { type: 'string' } },
  { path: 'properties.age', type: 'removed', oldValue: { type: 'number' }, newValue: undefined },
  { path: 'properties.email.minLength', type: 'changed', oldValue: 0, newValue: 5 },
  { path: 'properties.id', type: 'type-changed', oldValue: 'string', newValue: 'number' },
];

describe('summarizeDiff', () => {
  it('returns correct total changes count', () => {
    const summary = summarizeDiff(mockDiffs);
    expect(summary.totalChanges).toBe(4);
  });

  it('identifies added fields correctly', () => {
    const summary = summarizeDiff(mockDiffs);
    expect(summary.addedFields).toContain('properties.name');
    expect(summary.addedFields).toHaveLength(1);
  });

  it('identifies removed fields correctly', () => {
    const summary = summarizeDiff(mockDiffs);
    expect(summary.removedFields).toContain('properties.age');
  });

  it('identifies modified fields correctly', () => {
    const summary = summarizeDiff(mockDiffs);
    expect(summary.modifiedFields).toContain('properties.email.minLength');
    expect(summary.modifiedFields).toContain('properties.id');
  });

  it('counts breaking changes correctly', () => {
    const summary = summarizeDiff(mockDiffs);
    // removed + minLength change + type-changed = 3
    expect(summary.breakingChanges).toBe(3);
  });

  it('counts non-breaking changes correctly', () => {
    const summary = summarizeDiff(mockDiffs);
    expect(summary.nonBreakingChanges).toBe(1);
  });

  it('groups changes by type', () => {
    const summary = summarizeDiff(mockDiffs);
    expect(summary.changesByType['added']).toBe(1);
    expect(summary.changesByType['removed']).toBe(1);
    expect(summary.changesByType['changed']).toBe(1);
    expect(summary.changesByType['type-changed']).toBe(1);
  });

  it('handles empty diffs array', () => {
    const summary = summarizeDiff([]);
    expect(summary.totalChanges).toBe(0);
    expect(summary.breakingChanges).toBe(0);
    expect(summary.addedFields).toHaveLength(0);
  });
});

describe('formatSummary', () => {
  it('formats summary as readable string', () => {
    const summary = summarizeDiff(mockDiffs);
    const output = formatSummary(summary);
    expect(output).toContain('Total changes: 4');
    expect(output).toContain('Breaking changes: 3');
    expect(output).toContain('Non-breaking changes: 1');
  });

  it('includes field lists in output', () => {
    const summary = summarizeDiff(mockDiffs);
    const output = formatSummary(summary);
    expect(output).toContain('Added');
    expect(output).toContain('Removed');
    expect(output).toContain('Modified');
  });
});
