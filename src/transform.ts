import { JSONSchema, SchemaDiff } from './types';

export type TransformRule = {
  match: (diff: SchemaDiff) => boolean;
  apply: (schema: JSONSchema, diff: SchemaDiff) => JSONSchema;
};

export type TransformResult = {
  schema: JSONSchema;
  applied: string[];
  skipped: string[];
};

export function renameProperty(
  schema: JSONSchema,
  from: string,
  to: string
): JSONSchema {
  if (!schema.properties) return schema;
  const props = { ...schema.properties };
  if (!(from in props)) return schema;
  props[to] = props[from];
  delete props[from];
  const required = schema.required
    ? schema.required.map((r: string) => (r === from ? to : r))
    : undefined;
  return { ...schema, properties: props, ...(required ? { required } : {}) };
}

export function addDefaultValue(
  schema: JSONSchema,
  property: string,
  defaultValue: unknown
): JSONSchema {
  if (!schema.properties || !(property in schema.properties)) return schema;
  return {
    ...schema,
    properties: {
      ...schema.properties,
      [property]: { ...schema.properties[property], default: defaultValue },
    },
  };
}

export function dropProperty(
  schema: JSONSchema,
  property: string
): JSONSchema {
  if (!schema.properties) return schema;
  const props = { ...schema.properties };
  delete props[property];
  const required = schema.required
    ? schema.required.filter((r: string) => r !== property)
    : undefined;
  return { ...schema, properties: props, ...(required ? { required } : {}) };
}

export function applyTransforms(
  schema: JSONSchema,
  diffs: SchemaDiff[],
  rules: TransformRule[]
): TransformResult {
  let current = { ...schema };
  const applied: string[] = [];
  const skipped: string[] = [];

  for (const diff of diffs) {
    const rule = rules.find((r) => r.match(diff));
    if (rule) {
      current = rule.apply(current, diff);
      applied.push(diff.path);
    } else {
      skipped.push(diff.path);
    }
  }

  return { schema: current, applied, skipped };
}
