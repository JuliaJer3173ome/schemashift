import { describe, it, expect } from 'vitest';
import { generateReport } from './report';
import { SchemaDiff } from './types';

describe('generateReport', () => {
  it('returns no-change message for empty diffs', () => {
    const report = generateReport([]);
    expect(report).toContain('No changes detected');
  });

  it('returns markdown no-change message', () => {
    const report = generateReport([], { format: 'markdown' });
    expect(report).toContain('No changes detected');
    expect(report.startsWith('>')).toBe(true);
  });

  it('formats added diff in text mode', () => {
    const diffs: SchemaDiff[] = [{ type: 'added', path: 'properties.age', value: { type: 'number' } }];
    const report = generateReport(diffs);
    expect(report).toContain('[Added]');
    expect(report).toContain('properties.age');
  });

  it('formats removed diff in text mode', () => {
    const diffs: SchemaDiff[] = [{ type: 'removed', path: 'properties.name', oldValue: { type: 'string' } }];
    const report = generateReport(diffs);
    expect(report).toContain('[Removed]');
    expect(report).toContain('properties.name');
  });

  it('formats changed diff with old and new values', () => {
    const diffs: SchemaDiff[] = [{ type: 'changed', path: 'description', oldValue: 'old text', value: 'new text' }];
    const report = generateReport(diffs);
    expect(report).toContain('->') ;
    expect(report).toContain('old text');
    expect(report).toContain('new text');
  });

  it('formats diffs in markdown mode', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: 'properties.score', value: { type: 'integer' } },
      { type: 'type_changed', path: 'type', oldValue: 'string', value: 'number' },
    ];
    const report = generateReport(diffs, { format: 'markdown' });
    expect(report).toContain('## Schema Changes');
    expect(report).toContain('✅');
    expect(report).toContain('⚠️');
  });

  it('includes all diffs in report', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: 'properties.a', value: 1 },
      { type: 'removed', path: 'properties.b', oldValue: 2 },
      { type: 'changed', path: 'properties.c', oldValue: 3, value: 4 },
    ];
    const report = generateReport(diffs);
    expect(report).toContain('properties.a');
    expect(report).toContain('properties.b');
    expect(report).toContain('properties.c');
  });
});
