import { AuditEntry, AuditReport } from './audit';

export function filterAuditBySeverity(
  report: AuditReport,
  severity: 'low' | 'medium' | 'high' | 'none'
): AuditEntry[] {
  const rank = { none: 0, low: 1, medium: 2, high: 3 } as const;
  return report.entries.filter(
    (e) => rank[e.severity] >= rank[severity]
  );
}

export function summarizeAuditReport(report: AuditReport): string {
  const breakingTotal = report.entries.reduce(
    (sum, e) => sum + e.breakingCount,
    0
  );
  const avgScore =
    report.entries.length > 0
      ? Math.round(
          report.entries.reduce((sum, e) => sum + e.compatibilityScore, 0) /
            report.entries.length
        )
      : 100;
  return (
    `${report.entries.length} audit(s), ` +
    `${breakingTotal} breaking change(s), ` +
    `avg score ${avgScore}, ` +
    `overall severity: ${report.overallSeverity}`
  );
}

export function mergeAuditReports(
  a: AuditReport,
  b: AuditReport
): AuditReport {
  const entries = [...a.entries, ...b.entries];
  const totalChanges = a.totalChanges + b.totalChanges;
  const hasBreaking = a.hasBreaking || b.hasBreaking;
  const rank = { none: 0, low: 1, medium: 2, high: 3 } as const;
  const overallSeverity = (
    rank[a.overallSeverity] >= rank[b.overallSeverity]
      ? a.overallSeverity
      : b.overallSeverity
  ) as 'low' | 'medium' | 'high' | 'none';
  return { entries, totalChanges, hasBreaking, overallSeverity };
}

export function auditReportToJson(report: AuditReport): string {
  return JSON.stringify(report, null, 2);
}
