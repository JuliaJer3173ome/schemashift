import { SchemaDiff, ChangeType } from './types';

export interface DiffStats {
  total: number;
  additions: number;
  removals: number;
  modifications: number;
  breaking: number;
  nonBreaking: number;
  byPath: Record<string, number>;
  byDepth: Record<number, number>;
}

export function computeDiffStats(diffs: SchemaDiff[]): DiffStats {
  const stats: DiffStats = {
    total: diffs.length,
    additions: 0,
    removals: 0,
    modifications: 0,
    breaking: 0,
    nonBreaking: 0,
    byPath: {},
    byDepth: {},
  };

  for (const diff of diffs) {
    if (diff.type === 'add') stats.additions++;
    else if (diff.type === 'remove') stats.removals++;
    else if (diff.type === 'change') stats.modifications++;

    if (diff.breaking) stats.breaking++;
    else stats.nonBreaking++;

    const topSegment = diff.path.split('.')[0] || '(root)';
    stats.byPath[topSegment] = (stats.byPath[topSegment] ?? 0) + 1;

    const depth = diff.path === '' ? 0 : diff.path.split('.').length;
    stats.byDepth[depth] = (stats.byDepth[depth] ?? 0) + 1;
  }

  return stats;
}

export function formatStats(stats: DiffStats): string {
  const lines: string[] = [
    `Total changes : ${stats.total}`,
    `  Additions   : ${stats.additions}`,
    `  Removals    : ${stats.removals}`,
    `  Modifications: ${stats.modifications}`,
    `Breaking      : ${stats.breaking}`,
    `Non-breaking  : ${stats.nonBreaking}`,
  ];

  if (Object.keys(stats.byPath).length > 0) {
    lines.push('By top-level path:');
    for (const [path, count] of Object.entries(stats.byPath)) {
      lines.push(`  ${path}: ${count}`);
    }
  }

  return lines.join('\n');
}

export function statsToJson(stats: DiffStats): string {
  return JSON.stringify(stats, null, 2);
}
