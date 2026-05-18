import { JSONSchema, SchemaDiff } from './types';

export type TraverseCallback = (schema: JSONSchema, path: string) => void;

export function traverseSchema(schema: JSONSchema, callback: TraverseCallback, path = '#'): void {
  callback(schema, path);

  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      traverseSchema(value as JSONSchema, callback, `${path}/properties/${key}`);
    }
  }

  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, i) =>
        traverseSchema(item as JSONSchema, callback, `${path}/items/${i}`)
      );
    } else {
      traverseSchema(schema.items as JSONSchema, callback, `${path}/items`);
    }
  }

  for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
    const subschemas = schema[keyword];
    if (Array.isArray(subschemas)) {
      subschemas.forEach((sub, i) =>
        traverseSchema(sub as JSONSchema, callback, `${path}/${keyword}/${i}`)
      );
    }
  }

  if (schema.not) {
    traverseSchema(schema.not as JSONSchema, callback, `${path}/not`);
  }

  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    traverseSchema(schema.additionalProperties as JSONSchema, callback, `${path}/additionalProperties`);
  }
}

export function collectPaths(schema: JSONSchema): string[] {
  const paths: string[] = [];
  traverseSchema(schema, (_, path) => paths.push(path));
  return paths;
}

export function findNodeAtPath(schema: JSONSchema, targetPath: string): JSONSchema | undefined {
  let found: JSONSchema | undefined;
  traverseSchema(schema, (node, path) => {
    if (path === targetPath) found = node;
  });
  return found;
}

export function traverseDiff(
  diffs: SchemaDiff[],
  callback: (diff: SchemaDiff, depth: number) => void
): void {
  for (const diff of diffs) {
    const depth = (diff.path.match(/\//g) || []).length;
    callback(diff, depth);
  }
}
