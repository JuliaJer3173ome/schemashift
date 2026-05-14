export { diffSchemas } from './diff';
export { generateReport, formatDiff } from './report';
export { generateMigrations, applyMigrations, hasBreakingChanges, isBreakingChange } from './migrate';
export { validateSchema, validateDiffSchemas } from './validate';
export type {
  JSONSchema,
  SchemaDiff,
  DiffType,
  MigrationStep,
  MigrationPlan,
} from './types';
export type { ValidationResult } from './validate';
