import { describe, it, expect } from 'vitest';
import {
  classifySeverity,
  buildAuditEntry,
  createAuditReport,
  formatAuditReport,
} from './audit';
import { ChangeType } from './types';
import type { SchemaDiff } from './types';

const added: SchemaDiff = {
  path: 'properties.name',
  type: ChangeType.Added,
  before: undefined,
  after: { type: 'string' },
};

const removed: SchemaDiff = {
  path: 'properties.age',
  type: ChangeType.Removed,
  before: { type: 'number' },
  after: undefined,
};

describe('classifySeverity', () => {
  it('returns none when no breaking and high score', () => {
    expect(classifySeverity(0, 95)).toBe('none');
  });
  it('returns low when no breaking but lower score', () => {
    expect(classifySeverity(0, 70)).toBe('low');
  });
  it('returns medium for few breaking with decent score', () => {
    expect(classifySeverity(2, 65)).toBe('medium');
  });
  it('returns high for many breaking changes', () => {
    expect(classifySeverity(5, 30)).toBe('high');
  });
});

describe('buildAuditEntry', () => {
  it('counts breaking and non-breaking changes', () => {
    const entry = buildAuditEntry([added, removed], 'test diff');
    expect(entry.breakingCount).toBe(1);
    expect(entry.nonBreakingCount).toBe(1);
    expect(entry.description).toBe('test diff');
  });

  it('has a timestamp', () => {
    const entry = buildAuditEntry([], 'empty');
    expect(entry.timestamp).toBeTruthy();
  });

  it('assigns severity none for empty diffs', () => {
    const entry = buildAuditEntry([], 'empty');
    expect(entry.severity).toBe('none');
  });
});

describe('createAuditReport', () => {
  it('aggregates entries correctly', () => {
    const e1 = buildAuditEntry([added], 'add only');
    const e2 = buildAuditEntry([removed], 'remove only');
    const report = createAuditReport([e1, e2]);
    expect(report.totalChanges).toBe(2);
    expect(report.hasBreaking).toBe(true);
  });

  it('returns none severity for empty entries', () => {
    const report = createAuditReport([]);
    expect(report.overallSeverity).toBe('none');
    expect(report.totalChanges).toBe(0);
  });
});

describe('formatAuditReport', () => {
  it('includes severity and description in output', () => {
    const entry = buildAuditEntry([removed], 'v2 schema');
    const report = createAuditReport([entry]);
    const text = formatAuditReport(report);
    expect(text).toContain('v2 schema');
    expect(text).toContain('Has Breaking');
  });
});
