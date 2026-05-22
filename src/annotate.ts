import { JSONSchema, SchemaDiff } from './types';

export interface Annotation {
  path: string;
  kind: 'info' | 'warning' | 'breaking';
  message: string;
}

export interface AnnotatedSchema {
  schema: JSONSchema;
  annotations: Annotation[];
}

export function annotateSchema(schema: JSONSchema): AnnotatedSchema {
  const annotations: Annotation[] = [];

  if (!schema.description) {
    annotations.push({ path: '#', kind: 'info', message: 'Schema is missing a description.' });
  }

  if (schema.type === 'object' && !schema.properties) {
    annotations.push({ path: '#', kind: 'warning', message: 'Object schema has no properties defined.' });
  }

  if (schema.type === 'object' && schema.properties) {
    for (const key of Object.keys(schema.properties)) {
      const prop = schema.properties[key] as JSONSchema;
      if (!prop.description) {
        annotations.push({ path: `#/properties/${key}`, kind: 'info', message: `Property "${key}" is missing a description.` });
      }
      if (prop.type === undefined) {
        annotations.push({ path: `#/properties/${key}`, kind: 'warning', message: `Property "${key}" has no type defined.` });
      }
    }
  }

  if (schema.additionalProperties === true || schema.additionalProperties === undefined) {
    annotations.push({ path: '#', kind: 'info', message: 'additionalProperties is not restricted; consider setting it to false.' });
  }

  return { schema, annotations };
}

export function annotateDiff(diffs: SchemaDiff[]): Annotation[] {
  return diffs.map((diff): Annotation => {
    if (diff.type === 'removed') {
      return { path: diff.path, kind: 'breaking', message: `Field removed at "${diff.path}": was ${JSON.stringify(diff.oldValue)}.` };
    }
    if (diff.type === 'changed') {
      const isTypeChange = diff.path.endsWith('/type');
      return {
        path: diff.path,
        kind: isTypeChange ? 'breaking' : 'warning',
        message: `Field changed at "${diff.path}": ${JSON.stringify(diff.oldValue)} → ${JSON.stringify(diff.newValue)}.`,
      };
    }
    return { path: diff.path, kind: 'info', message: `Field added at "${diff.path}": ${JSON.stringify(diff.newValue)}.` };
  });
}

export function formatAnnotations(annotations: Annotation[]): string {
  if (annotations.length === 0) return 'No annotations.';
  return annotations
    .map(a => `[${a.kind.toUpperCase()}] ${a.path}: ${a.message}`)
    .join('\n');
}

/**
 * Filters annotations by one or more severity kinds.
 * Useful for surfacing only breaking changes or warnings during CI checks.
 */
export function filterAnnotations(annotations: Annotation[], ...kinds: Annotation['kind'][]): Annotation[] {
  const kindSet = new Set(kinds);
  return annotations.filter(a => kindSet.has(a.kind));
}
