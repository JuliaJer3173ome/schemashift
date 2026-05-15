import { JSONSchema } from './types';

/**
 * Expands shorthand schema definitions to their canonical form.
 * e.g. `{ type: 'string' }` stays as-is, but missing optional fields get defaults.
 */
export function normalizeSchema(schema: JSONSchema): JSONSchema {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  const normalized: JSONSchema = { ...schema };

  // Ensure type is always present when inferrable
  if (!normalized.type && normalized.properties) {
    normalized.type = 'object';
  }

  if (!normalized.type && normalized.items) {
    normalized.type = 'array';
  }

  // Normalize properties recursively
  if (normalized.properties) {
    const normalizedProps: Record<string, JSONSchema> = {};
    for (const [key, value] of Object.entries(normalized.properties)) {
      normalizedProps[key] = normalizeSchema(value as JSONSchema);
    }
    normalized.properties = normalizedProps;
  }

  // Normalize items recursively
  if (normalized.items && typeof normalized.items === 'object') {
    normalized.items = normalizeSchema(normalized.items as JSONSchema);
  }

  // Ensure required is always an array if present
  if (normalized.required && !Array.isArray(normalized.required)) {
    normalized.required = [];
  }

  // Deduplicate required entries
  if (Array.isArray(normalized.required)) {
    normalized.required = [...new Set(normalized.required)];
  }

  // Normalize default-less optional fields
  if (normalized.type === 'object' && !normalized.properties) {
    normalized.properties = {};
  }

  // Normalize additionalProperties default
  if (normalized.type === 'object' && normalized.additionalProperties === undefined) {
    normalized.additionalProperties = true;
  }

  return normalized;
}

/**
 * Checks whether two schemas are structurally equivalent after normalization.
 */
export function schemasAreEquivalent(a: JSONSchema, b: JSONSchema): boolean {
  const na = normalizeSchema(a);
  const nb = normalizeSchema(b);
  return JSON.stringify(sortKeys(na)) === JSON.stringify(sortKeys(nb));
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeys(v)])
    );
  }
  return obj;
}
