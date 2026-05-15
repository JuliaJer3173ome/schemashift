export { diffSchemas } from './diff';
export { generateReport, formatDiff } from './report';
export { generateMigrations, applyMigrations, hasBreakingChanges } from './migrate';
export { validateSchema, validateDiffSchemas } from './validate';
export { formatOutput, formatAsText, formatAsMarkdown, formatAsJson } from './format';
export type { OutputFormat, FormatOptions } from './format';
export type { SchemaDiff, MigrationStep, SchemaDefinition } from './types';
