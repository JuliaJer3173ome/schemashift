import { JSONSchema, SchemaDiff } from './types';
import { diffSchemas } from './diff';

export interface MergeOptions {
  preferSource?: boolean;
  allowBreaking?: boolean;
}

export interface MergeResult {
  schema: JSONSchema;
  conflicts: SchemaDiff[];
  merged: boolean;
}

/**
 * Merges two JSON schemas together, preferring properties from `target`.
 * Returns a MergeResult with the merged schema and any detected conflicts.
 */
export function mergeSchemas(
  source: JSONSchema,
  target: JSONSchema,
  options: MergeOptions = {}
): MergeResult {
  const { preferSource = false } = options;
  const conflicts: SchemaDiff[] = [];

  const diffs = diffSchemas(source, target);
  const conflictingPaths = new Set<string>();

  for (const diff of diffs) {
    if (diff.type === 'changed') {
      conflicts.push(diff);
      conflictingPaths.add(diff.path);
    }
  }

  const merged = deepMerge(source, target, preferSource);

  return {
    schema: merged,
    conflicts,
    merged: conflicts.length === 0,
  };
}

function deepMerge(
  source: JSONSchema,
  target: JSONSchema,
  preferSource: boolean
): JSONSchema {
  const base = preferSource ? { ...target, ...source } : { ...source, ...target };

  if (source.properties && target.properties) {
    base.properties = {};
    const allKeys = new Set([
      ...Object.keys(source.properties),
      ...Object.keys(target.properties),
    ]);
    for (const key of allKeys) {
      const srcProp = source.properties[key];
      const tgtProp = target.properties[key];
      if (srcProp && tgtProp) {
        base.properties[key] = deepMerge(srcProp, tgtProp, preferSource);
      } else {
        base.properties[key] = (srcProp || tgtProp) as JSONSchema;
      }
    }
  }

  if (source.required || target.required) {
    const srcReq = source.required ?? [];
    const tgtReq = target.required ?? [];
    base.required = Array.from(new Set([...srcReq, ...tgtReq]));
  }

  return base;
}
