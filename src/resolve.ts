import { JSONSchema } from './types';

export interface ResolveOptions {
  maxDepth?: number;
  strict?: boolean;
}

export interface ResolvedSchema {
  schema: JSONSchema;
  refs: Record<string, JSONSchema>;
  depth: number;
}

/**
 * Extracts the $ref path from a reference string.
 * Supports local JSON Pointer refs like "#/definitions/Foo".
 */
export function parseRef(ref: string): string[] {
  if (!ref.startsWith('#/')) {
    throw new Error(`Unsupported $ref format: "${ref}". Only local refs (#/...) are supported.`);
  }
  return ref.slice(2).split('/').map(part => part.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/**
 * Looks up a JSON Pointer path in a root schema object.
 */
export function lookupRef(root: JSONSchema, path: string[]): JSONSchema {
  let current: unknown = root;
  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in (current as object))) {
      throw new Error(`Could not resolve ref path: /${path.join('/')}`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current as JSONSchema;
}

/**
 * Recursively resolves all $ref entries in a schema against the provided root.
 */
export function resolveRefs(
  schema: JSONSchema,
  root: JSONSchema,
  options: ResolveOptions = {},
  depth = 0
): JSONSchema {
  const { maxDepth = 10, strict = false } = options;

  if (depth > maxDepth) {
    if (strict) throw new Error(`Max resolution depth (${maxDepth}) exceeded.`);
    return schema;
  }

  if (typeof schema !== 'object' || schema === null) return schema;

  if ('$ref' in schema && typeof schema.$ref === 'string') {
    const path = parseRef(schema.$ref);
    const resolved = lookupRef(root, path);
    return resolveRefs(resolved, root, options, depth + 1);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? resolveRefs(item as JSONSchema, root, options, depth + 1)
          : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = resolveRefs(value as JSONSchema, root, options, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result as JSONSchema;
}

/**
 * Fully resolves a schema and returns a ResolvedSchema with metadata.
 */
export function resolveSchema(
  schema: JSONSchema,
  options: ResolveOptions = {}
): ResolvedSchema {
  const refs: Record<string, JSONSchema> = {};
  const definitions = (schema.definitions ?? {}) as Record<string, JSONSchema>;
  for (const [name, def] of Object.entries(definitions)) {
    refs[`#/definitions/${name}`] = def as JSONSchema;
  }
  const resolved = resolveRefs(schema, schema, options);
  const depth = Object.keys(refs).length > 0 ? 1 : 0;
  return { schema: resolved, refs, depth };
}
