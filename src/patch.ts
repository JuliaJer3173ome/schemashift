import { JSONSchema, SchemaDiff, PatchResult } from './types';

/**
 * Applies a list of diffs as a patch to a base schema,
 * producing a new schema that reflects all changes.
 */
export function applyPatch(
  base: JSONSchema,
  diffs: SchemaDiff[]
): PatchResult {
  const result: JSONSchema = JSON.parse(JSON.stringify(base));
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const diff of diffs) {
    try {
      applyDiff(result, diff);
      applied.push(diff.path);
    } catch (err) {
      skipped.push(diff.path);
    }
  }

  return { schema: result, applied, skipped };
}

function applyDiff(schema: JSONSchema, diff: SchemaDiff): void {
  const parts = diff.path.replace(/^#\//, '').split('/').filter(Boolean);

  if (parts.length === 0) {
    if (diff.type === 'changed' && diff.to !== undefined) {
      Object.assign(schema, diff.to);
    }
    return;
  }

  let current: Record<string, unknown> = schema as Record<string, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastKey = parts[parts.length - 1];

  if (diff.type === 'added') {
    current[lastKey] = diff.to;
  } else if (diff.type === 'removed') {
    delete current[lastKey];
  } else if (diff.type === 'changed') {
    current[lastKey] = diff.to;
  }
}

/**
 * Reverts a list of diffs on a schema (inverse patch).
 */
export function revertPatch(
  patched: JSONSchema,
  diffs: SchemaDiff[]
): PatchResult {
  const inverseDiffs: SchemaDiff[] = diffs.map((d) => ({
    ...d,
    type:
      d.type === 'added'
        ? 'removed'
        : d.type === 'removed'
        ? 'added'
        : 'changed',
    from: d.to,
    to: d.from,
  }));
  return applyPatch(patched, inverseDiffs);
}
