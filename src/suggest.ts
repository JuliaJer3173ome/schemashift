import { SchemaDiff, ChangeType } from './types';

export interface Suggestion {
  path: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  fix?: string;
}

export interface SuggestionReport {
  suggestions: Suggestion[];
  total: number;
  hasCritical: boolean;
}

export function suggestForDiff(diff: SchemaDiff): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (diff.type === ChangeType.Removed) {
    suggestions.push({
      path: diff.path,
      message: `Property "${diff.path}" was removed. Ensure consumers are updated.`,
      severity: 'error',
      fix: 'Consider deprecating before removal or providing a migration path.',
    });
  }

  if (diff.type === ChangeType.TypeChanged) {
    suggestions.push({
      path: diff.path,
      message: `Type of "${diff.path}" changed from "${diff.oldValue}" to "${diff.newValue}".`,
      severity: 'error',
      fix: 'Use a union type or versioned schema to maintain compatibility.',
    });
  }

  if (diff.type === ChangeType.Added) {
    suggestions.push({
      path: diff.path,
      message: `New property "${diff.path}" added.`,
      severity: 'info',
      fix: 'Mark as optional to maintain backward compatibility.',
    });
  }

  if (diff.type === ChangeType.Modified) {
    suggestions.push({
      path: diff.path,
      message: `Property "${diff.path}" was modified (${diff.oldValue} → ${diff.newValue}).`,
      severity: 'warning',
      fix: 'Validate that existing data conforms to the new constraint.',
    });
  }

  return suggestions;
}

export function generateSuggestions(diffs: SchemaDiff[]): SuggestionReport {
  const suggestions = diffs.flatMap(suggestForDiff);
  return {
    suggestions,
    total: suggestions.length,
    hasCritical: suggestions.some((s) => s.severity === 'error'),
  };
}

export function formatSuggestions(report: SuggestionReport): string {
  if (report.total === 0) return 'No suggestions.';
  const lines = report.suggestions.map((s) => {
    const icon = s.severity === 'error' ? '✖' : s.severity === 'warning' ? '⚠' : 'ℹ';
    const fix = s.fix ? `\n    Fix: ${s.fix}` : '';
    return `${icon} [${s.path}] ${s.message}${fix}`;
  });
  return lines.join('\n');
}
