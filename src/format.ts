import { SchemaDiff } from './types';

export type OutputFormat = 'json' | 'markdown' | 'text';

export interface FormatOptions {
  format: OutputFormat;
  includeBreaking?: boolean;
  title?: string;
}

const BREAKING_LABEL = '⚠️  BREAKING';
const ADDED_LABEL = '✅ added';
const REMOVED_LABEL = '❌ removed';
const CHANGED_LABEL = '🔄 changed';

function getChangeLabel(type: SchemaDiff['type']): string {
  switch (type) {
    case 'added': return ADDED_LABEL;
    case 'removed': return REMOVED_LABEL;
    case 'changed': return CHANGED_LABEL;
    default: return type;
  }
}

export function formatAsText(diffs: SchemaDiff[], title = 'Schema Diff'): string {
  if (diffs.length === 0) return `${title}\nNo changes detected.\n`;
  const lines = [`${title}`, '='.repeat(title.length)];
  for (const diff of diffs) {
    const breaking = diff.breaking ? ` [${BREAKING_LABEL}]` : '';
    const label = getChangeLabel(diff.type);
    lines.push(`${label}${breaking}  ${diff.path}`);
    if (diff.oldValue !== undefined) lines.push(`  before: ${JSON.stringify(diff.oldValue)}`);
    if (diff.newValue !== undefined) lines.push(`  after:  ${JSON.stringify(diff.newValue)}`);
  }
  return lines.join('\n') + '\n';
}

export function formatAsMarkdown(diffs: SchemaDiff[], title = 'Schema Diff'): string {
  if (diffs.length === 0) return `## ${title}\n\n_No changes detected._\n`;
  const lines = [`## ${title}\n`];
  lines.push('| Status | Breaking | Path | Before | After |');
  lines.push('|--------|----------|------|--------|-------|');
  for (const diff of diffs) {
    const breaking = diff.breaking ? '⚠️ Yes' : 'No';
    const before = diff.oldValue !== undefined ? `\`${JSON.stringify(diff.oldValue)}\`` : '-';
    const after = diff.newValue !== undefined ? `\`${JSON.stringify(diff.newValue)}\`` : '-';
    lines.push(`| ${diff.type} | ${breaking} | \`${diff.path}\` | ${before} | ${after} |`);
  }
  return lines.join('\n') + '\n';
}

export function formatAsJson(diffs: SchemaDiff[], title = 'Schema Diff'): string {
  return JSON.stringify({ title, changes: diffs }, null, 2);
}

export function formatOutput(diffs: SchemaDiff[], options: FormatOptions): string {
  const filtered = options.includeBreaking === true
    ? diffs.filter(d => d.breaking)
    : diffs;
  const title = options.title ?? 'Schema Diff';
  switch (options.format) {
    case 'markdown': return formatAsMarkdown(filtered, title);
    case 'json': return formatAsJson(filtered, title);
    case 'text':
    default: return formatAsText(filtered, title);
  }
}
