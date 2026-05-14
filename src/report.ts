import { SchemaDiff } from './types';

export type ReportFormat = 'text' | 'markdown';

export interface ReportOptions {
  format?: ReportFormat;
  includeUnchanged?: boolean;
}

const CHANGE_LABELS: Record<SchemaDiff['type'], string> = {
  added: 'Added',
  removed: 'Removed',
  changed: 'Changed',
  type_changed: 'Type Changed',
};

function formatDiff(diff: SchemaDiff, format: ReportFormat): string {
  const label = CHANGE_LABELS[diff.type];
  const path = diff.path || '(root)';

  if (format === 'markdown') {
    switch (diff.type) {
      case 'added':
        return `- ✅ **${label}** \`${path}\`: \`${JSON.stringify(diff.value)}\``;
      case 'removed':
        return `- ❌ **${label}** \`${path}\`: \`${JSON.stringify(diff.oldValue)}\``;
      case 'changed':
        return `- 🔄 **${label}** \`${path}\`: \`${JSON.stringify(diff.oldValue)}\` → \`${JSON.stringify(diff.value)}\``;
      case 'type_changed':
        return `- ⚠️ **${label}** \`${path}\`: \`${diff.oldValue}\` → \`${diff.value}\``;
    }
  }

  switch (diff.type) {
    case 'added':
      return `[${label}] ${path}: ${JSON.stringify(diff.value)}`;
    case 'removed':
      return `[${label}] ${path}: ${JSON.stringify(diff.oldValue)}`;
    case 'changed':
      return `[${label}] ${path}: ${JSON.stringify(diff.oldValue)} -> ${JSON.stringify(diff.value)}`;
    case 'type_changed':
      return `[${label}] ${path}: ${diff.oldValue} -> ${diff.value}`;
  }
}

export function generateReport(
  diffs: SchemaDiff[],
  options: ReportOptions = {}
): string {
  const { format = 'text' } = options;

  if (diffs.length === 0) {
    return format === 'markdown'
      ? '> No changes detected between schemas.'
      : 'No changes detected between schemas.';
  }

  const lines = diffs.map((diff) => formatDiff(diff, format));

  if (format === 'markdown') {
    return `## Schema Changes\n\n${lines.join('\n')}`;
  }

  return `Schema Changes:\n${lines.join('\n')}`;
}
