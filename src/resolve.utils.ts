import { JSONSchema } from './types';
import { resolveSchema, ResolveOptions } from './resolve';

/**
 * Returns true if the schema contains any $ref entries.
 */
export function hasRefs(schema: JSONSchema): boolean {
  if (typeof schema !== 'object' || schema === null) return false;
  if ('$ref' in schema) return true;
  return Object.values(schema).some(value => {
    if (Array.isArray(value)) return value.some(v => hasRefs(v as JSONSchema));
    if (typeof value === 'object' && value !== null) return hasRefs(value as JSONSchema);
    return false;
  });
}

/**
 * Collects all unique $ref strings from a schema.
 */
export function collectRefs(schema: JSONSchema, found: Set<string> = new Set()): string[] {
  if (typeof schema !== 'object' || schema === null) return [...found];
  if ('$ref' in schema && typeof schema.$ref === 'string') found.add(schema.$ref);
  for (const value of Object.values(schema)) {
    if (Array.isArray(value)) value.forEach(v => collectRefs(v as JSONSchema, found));
    else if (typeof value === 'object' && value !== null) collectRefs(value as JSONSchema, found);
  }
  return [...found];
}

/**
 * Strips all $ref entries from a schema (replaces with empty object).
 */
export function stripRefs(schema: JSONSchema): JSONSchema {
  if (typeof schema !== 'object' || schema === null) return schema;
  if ('$ref' in schema) return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (Array.isArray(value)) {
      result[key] = value.map(v =>
        typeof v === 'object' && v !== null ? stripRefs(v as JSONSchema) : v
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = stripRefs(value as JSONSchema);
    } else {
      result[key] = value;
    }
  }
  return result as JSONSchema;
}

/**
 * Resolves a schema only if it contains refs; otherwise returns it unchanged.
 */
export function resolveIfNeeded(
  schema: JSONSchema,
  options?: ResolveOptions
): JSONSchema {
  if (!hasRefs(schema)) return schema;
  return resolveSchema(schema, options).schema;
}
