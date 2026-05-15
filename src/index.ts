export { diffSchemas } from './diff';
export { generateReport, formatDiff } from './report';
export { generateMigrations, applyMigrations, hasBreakingChanges } from './migrate';
export { validateSchema, validateDiffSchemas } from './validate';
export { formatOutput, formatAsText, formatAsMarkdown, formatAsJson } from './format';
export { applyPatch, applyDiff, revertPatch } from './patch';
export { summarizeDiff, formatSummary } from './summary';
export { buildChangelogEntry, formatChangelog } from './changelog';
export type { Changelog, ChangelogEntry } from './changelog';
export type {
  SchemaDiff,
  ChangeType,
  MigrationStep,
  SchemaDefinition,
  DiffOptions,
  ReportOptions,
} from './types';
