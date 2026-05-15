import { JSONSchema, SchemaDiff } from './types';
import { diffSchemas } from './diff';

export interface CompareOptions {
  ignoreDescriptions?: boolean;
  ignoreExamples?: boolean;
  ignoreDefaults?: boolean;
}

export interface CompareResult {
  areEqual: boolean;
  diff: SchemaDiff[];
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  breakingCount: number;
}

function filterDiffs(diffs: SchemaDiff[], options: CompareOptions): SchemaDiff[] {
  return diffs.filter((d) => {
    if (options.ignoreDescriptions && d.path.endsWith('description')) return false;
    if (options.ignoreExamples && d.path.endsWith('examples')) return false;
    if (options.ignoreDefaults && d.path.endsWith('default')) return false;
    return true;
  });
}

export function compareSchemas(
  source: JSONSchema,
  target: JSONSchema,
  options: CompareOptions = {}
): CompareResult {
  const rawDiffs = diffSchemas(source, target);
  const diff = filterDiffs(rawDiffs, options);

  const addedCount = diff.filter((d) => d.type === 'added').length;
  const removedCount = diff.filter((d) => d.type === 'removed').length;
  const modifiedCount = diff.filter((d) => d.type === 'modified').length;
  const breakingCount = diff.filter((d) => d.breaking).length;

  return {
    areEqual: diff.length === 0,
    diff,
    addedCount,
    removedCount,
    modifiedCount,
    breakingCount,
  };
}

export function schemasAreCompatible(
  source: JSONSchema,
  target: JSONSchema,
  options: CompareOptions = {}
): boolean {
  const result = compareSchemas(source, target, options);
  return result.breakingCount === 0;
}
