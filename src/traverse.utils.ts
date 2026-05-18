import { JSONSchema } from './types';
import { traverseSchema, collectPaths } from './traverse';

export function countNodes(schema: JSONSchema): number {
  let count = 0;
  traverseSchema(schema, () => { count++; });
  return count;
}

export function getSchemaDepth(schema: JSONSchema): number {
  const paths = collectPaths(schema);
  return paths.reduce((max, path) => {
    const depth = (path.match(/\//g) || []).length;
    return Math.max(max, depth);
  }, 0);
}

export function findNodesByType(schema: JSONSchema, type: string): string[] {
  const matches: string[] = [];
  traverseSchema(schema, (node, path) => {
    if (node.type === type) matches.push(path);
  });
  return matches;
}

export function hasNestedRefs(schema: JSONSchema): boolean {
  let found = false;
  traverseSchema(schema, (node) => {
    if (node.$ref) found = true;
  });
  return found;
}

export function collectRequiredFields(schema: JSONSchema): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  traverseSchema(schema, (node, path) => {
    if (node.required && Array.isArray(node.required)) {
      result[path] = node.required;
    }
  });
  return result;
}
