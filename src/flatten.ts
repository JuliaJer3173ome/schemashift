import { JSONSchema, SchemaDiff } from './types';

export interface FlatSchema {
  path: string;
  type: string | string[] | undefined;
  required: boolean;
  description?: string;
  enum?: unknown[];
  default?: unknown;
}

export function flattenSchema(
  schema: JSONSchema,
  prefix = '',
  requiredFields: string[] = []
): FlatSchema[] {
  const results: FlatSchema[] = [];

  if (schema.type !== undefined || schema.properties !== undefined) {
    results.push({
      path: prefix || '(root)',
      type: schema.type,
      required: requiredFields.includes(prefix.split('.').pop() ?? ''),
      description: schema.description,
      enum: schema.enum,
      default: schema.default,
    });
  }

  if (schema.properties) {
    const required = schema.required ?? [];
    for (const [key, value] of Object.entries(schema.properties)) {
      const childPath = prefix ? `${prefix}.${key}` : key;
      const nested = flattenSchema(value as JSONSchema, childPath, required);
      results.push(...nested);
    }
  }

  if (schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
    const itemPath = `${prefix}[]`;
    const nested = flattenSchema(schema.items as JSONSchema, itemPath, []);
    results.push(...nested);
  }

  return results;
}

export function flattenDiff(diffs: SchemaDiff[]): Record<string, SchemaDiff[]> {
  const grouped: Record<string, SchemaDiff[]> = {};
  for (const diff of diffs) {
    const key = diff.path || '(root)';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(diff);
  }
  return grouped;
}

export function formatFlatSchema(flat: FlatSchema[]): string {
  return flat
    .map((f) => {
      const type = Array.isArray(f.type) ? f.type.join(' | ') : (f.type ?? 'any');
      const req = f.required ? ' (required)' : '';
      const desc = f.description ? ` — ${f.description}` : '';
      return `${f.path}: ${type}${req}${desc}`;
    })
    .join('\n');
}
