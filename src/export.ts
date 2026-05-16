import { JSONSchema, SchemaDiff } from './types';
import { generateReport } from './report';
import { formatAsMarkdown, formatAsJson, formatAsText } from './format';
import { formatChangelog } from './changelog';
import { formatSummary, summarizeDiff } from './summary';

export type ExportFormat = 'json' | 'markdown' | 'text' | 'changelog';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  title?: string;
  version?: string;
}

export interface ExportResult {
  content: string;
  format: ExportFormat;
  generatedAt: string;
  metadata?: Record<string, unknown>;
}

export function exportDiff(
  diffs: SchemaDiff[],
  options: ExportOptions
): ExportResult {
  const { format, includeMetadata = false, title, version } = options;
  const generatedAt = new Date().toISOString();

  let content: string;

  switch (format) {
    case 'json':
      content = formatAsJson(diffs);
      break;
    case 'markdown':
      content = formatAsMarkdown(diffs);
      break;
    case 'changelog':
      content = formatChangelog(diffs, { title, version });
      break;
    case 'text':
    default:
      content = formatAsText(diffs);
      break;
  }

  const result: ExportResult = { content, format, generatedAt };

  if (includeMetadata) {
    const summary = summarizeDiff(diffs);
    result.metadata = {
      totalChanges: diffs.length,
      breakingChanges: summary.breakingCount,
      title: title ?? null,
      version: version ?? null,
    };
  }

  return result;
}

export function exportSchema(
  schema: JSONSchema,
  format: 'json' | 'text' = 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(schema, null, 2);
  }
  const lines: string[] = [];
  for (const [key, value] of Object.entries(schema)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  return lines.join('\n');
}

export function exportReport(
  before: JSONSchema,
  after: JSONSchema,
  diffs: SchemaDiff[],
  options: ExportOptions
): ExportResult {
  const report = generateReport(diffs);
  const summary = formatSummary(summarizeDiff(diffs));
  const exportResult = exportDiff(diffs, options);
  const combined = `${summary}\n\n${report}\n\n${exportResult.content}`;
  return { ...exportResult, content: combined };
}
