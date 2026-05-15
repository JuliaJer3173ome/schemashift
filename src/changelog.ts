import { SchemaDiff, ChangeType } from './types';
import { summarizeDiff } from './summary';

export interface ChangelogEntry {
  version: string;
  date: string;
  breaking: boolean;
  additions: string[];
  removals: string[];
  modifications: string[];
}

export interface Changelog {
  schemaName: string;
  entries: ChangelogEntry[];
}

function groupChangesByType(diffs: SchemaDiff[]): {
  additions: string[];
  removals: string[];
  modifications: string[];
} {
  const additions: string[] = [];
  const removals: string[] = [];
  const modifications: string[] = [];

  for (const diff of diffs) {
    const label = diff.path || '(root)';
    if (diff.type === ChangeType.Added) {
      additions.push(`${label}: added (value: ${JSON.stringify(diff.newValue)})`);
    } else if (diff.type === ChangeType.Removed) {
      removals.push(`${label}: removed (was: ${JSON.stringify(diff.oldValue)})`);
    } else if (diff.type === ChangeType.Modified) {
      modifications.push(
        `${label}: changed from ${JSON.stringify(diff.oldValue)} to ${JSON.stringify(diff.newValue)}`
      );
    }
  }

  return { additions, removals, modifications };
}

export function buildChangelogEntry(
  diffs: SchemaDiff[],
  version: string,
  date?: string
): ChangelogEntry {
  const { breaking } = summarizeDiff(diffs);
  const { additions, removals, modifications } = groupChangesByType(diffs);

  return {
    version,
    date: date ?? new Date().toISOString().split('T')[0],
    breaking,
    additions,
    removals,
    modifications,
  };
}

export function formatChangelog(changelog: Changelog): string {
  const lines: string[] = [`# Changelog: ${changelog.schemaName}`, ''];

  for (const entry of changelog.entries) {
    lines.push(`## [${entry.version}] - ${entry.date}${entry.breaking ? ' ⚠️ BREAKING' : ''}`);

    if (entry.additions.length > 0) {
      lines.push('### Added');
      entry.additions.forEach((a) => lines.push(`- ${a}`));
    }
    if (entry.removals.length > 0) {
      lines.push('### Removed');
      entry.removals.forEach((r) => lines.push(`- ${r}`));
    }
    if (entry.modifications.length > 0) {
      lines.push('### Modified');
      entry.modifications.forEach((m) => lines.push(`- ${m}`));
    }

    lines.push('');
  }

  return lines.join('\n');
}
