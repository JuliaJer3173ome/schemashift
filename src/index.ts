export { diffSchemas } from './diff';
export { generateReport, formatDiff } from './report';
export { generateMigrations, applyMigrations, hasBreakingChanges } from './migrate';
export { validateSchema, validateDiffSchemas } from './validate';
export { formatOutput } from './format';
export { applyPatch, revertPatch } from './patch';
export type {
  JSONSchema,
  SchemaDiff,
  MigrationStep,
  ValidationResult,
  PatchResult,
  OutputFormat,
  DiffType,
} from './types';
