import { SchemaDiff, ChangeType } from './types';
import { hasBreakingChanges } from './migrate';
import { scoreCompatibility } from './score';

export interface AuditEntry {
  timestamp: string;
  description: string;
  breakingCount: number;
  nonBreakingCount: number;
  compatibilityScore: number;
  severity: 'low' | 'medium' | 'high' | 'none';
}

export interface AuditReport {
  entries: AuditEntry[];
  totalChanges: number;
  hasBreaking: boolean;
  overallSeverity: 'low' | 'medium' | 'high' | 'none';
}

export function classifySeverity(
  breakingCount: number,
  score: number
): 'low' | 'medium' | 'high' | 'none' {
  if (breakingCount === 0 && score >= 90) return 'none';
  if (breakingCount === 0) return 'low';
  if (breakingCount <= 2 && score >= 60) return 'medium';
  return 'high';
}

export function buildAuditEntry(
  diffs: SchemaDiff[],
  description: string
): AuditEntry {
  const breakingCount = diffs.filter(
    (d) => d.type === ChangeType.Removed || d.type === ChangeType.Modified
  ).length;
  const nonBreakingCount = diffs.length - breakingCount;
  const result = scoreCompatibility(diffs);
  const compatibilityScore = result.score;
  const severity = classifySeverity(breakingCount, compatibilityScore);

  return {
    timestamp: new Date().toISOString(),
    description,
    breakingCount,
    nonBreakingCount,
    compatibilityScore,
    severity,
  };
}

export function createAuditReport(entries: AuditEntry[]): AuditReport {
  const totalChanges = entries.reduce(
    (sum, e) => sum + e.breakingCount + e.nonBreakingCount,
    0
  );
  const hasBreaking = entries.some((e) => e.breakingCount > 0);
  const severityRank = { none: 0, low: 1, medium: 2, high: 3 } as const;
  const overallSeverity = entries.reduce(
    (max, e) =>
      severityRank[e.severity] > severityRank[max] ? e.severity : max,
    'none' as 'low' | 'medium' | 'high' | 'none'
  );

  return { entries, totalChanges, hasBreaking, overallSeverity };
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Audit Report`,
    `============`,
    `Total Changes : ${report.totalChanges}`,
    `Has Breaking  : ${report.hasBreaking}`,
    `Severity      : ${report.overallSeverity}`,
    ``,
    `Entries:`,
  ];
  for (const entry of report.entries) {
    lines.push(
      `  [${entry.severity.toUpperCase()}] ${entry.description}` +
        ` | breaking=${entry.breakingCount}` +
        ` non-breaking=${entry.nonBreakingCount}` +
        ` score=${entry.compatibilityScore}`
    );
  }
  return lines.join('\n');
}
