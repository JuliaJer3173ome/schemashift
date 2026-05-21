import { describe, it, expect } from 'vitest';
import {
  filterAuditBySeverity,
  summarizeAuditReport,
  mergeAuditReports,
  auditReportToJson,
} from './audit.utils';
import { buildAuditEntry, createAuditReport } from './audit';
import { ChangeType } from './types';
import type { SchemaDiff } from './types';

const removed: SchemaDiff = {
  path: 'properties.x',
  type: ChangeType.Removed,
  before: { type: 'string' },
  after: undefined,
};

const added: SchemaDiff = {
  path: 'properties.y',
  type: ChangeType.Added,
  before: undefined,
  after: { type: 'boolean' },
};

describe('filterAuditBySeverity', () => {
  it('filters entries at or above the given severity', () => {
    const e1 = buildAuditEntry([], 'clean');
    const e2 = buildAuditEntry([removed], 'breaking');
    const report = createAuditReport([e1, e2]);
    const filtered = filterAuditBySeverity(report, 'medium');
    expect(filtered.every((e) => e.severity === 'high' || e.severity === 'medium')).toBe(true);
  });

  it('returns all entries when filtering by none', () => {
    const e1 = buildAuditEntry([], 'clean');
    const report = createAuditReport([e1]);
    expect(filterAuditBySeverity(report, 'none').length).toBe(1);
  });
});

describe('summarizeAuditReport', () => {
  it('produces a summary string', () => {
    const e1 = buildAuditEntry([added], 'add');
    const report = createAuditReport([e1]);
    const summary = summarizeAuditReport(report);
    expect(summary).toContain('audit');
    expect(summary).toContain('score');
  });

  it('handles empty report', () => {
    const report = createAuditReport([]);
    const summary = summarizeAuditReport(report);
    expect(summary).toContain('0 audit');
    expect(summary).toContain('avg score 100');
  });
});

describe('mergeAuditReports', () => {
  it('combines entries from both reports', () => {
    const r1 = createAuditReport([buildAuditEntry([added], 'r1')]);
    const r2 = createAuditReport([buildAuditEntry([removed], 'r2')]);
    const merged = mergeAuditReports(r1, r2);
    expect(merged.entries.length).toBe(2);
    expect(merged.hasBreaking).toBe(true);
  });

  it('picks the higher severity', () => {
    const r1 = createAuditReport([buildAuditEntry([], 'clean')]);
    const r2 = createAuditReport([buildAuditEntry([removed], 'breaking')]);
    const merged = mergeAuditReports(r1, r2);
    expect(['medium', 'high']).toContain(merged.overallSeverity);
  });
});

describe('auditReportToJson', () => {
  it('returns valid JSON', () => {
    const report = createAuditReport([buildAuditEntry([added], 'json test')]);
    const json = auditReportToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toHaveProperty('entries');
  });
});
