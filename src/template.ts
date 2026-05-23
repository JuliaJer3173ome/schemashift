import { SchemaDiff } from './types';

export interface SchemaTemplate {
  id: string;
  name: string;
  description: string;
  schema: Record<string, unknown>;
  tags?: string[];
}

export interface TemplateMatch {
  template: SchemaTemplate;
  score: number;
  missingFields: string[];
  extraFields: string[];
}

export function createTemplate(
  id: string,
  name: string,
  schema: Record<string, unknown>,
  options: { description?: string; tags?: string[] } = {}
): SchemaTemplate {
  return {
    id,
    name,
    description: options.description ?? '',
    schema,
    tags: options.tags ?? [],
  };
}

export function matchTemplate(
  schema: Record<string, unknown>,
  template: SchemaTemplate
): TemplateMatch {
  const schemaProps = Object.keys((schema.properties as Record<string, unknown>) ?? {});
  const templateProps = Object.keys((template.schema.properties as Record<string, unknown>) ?? {});

  const schemaSet = new Set(schemaProps);
  const templateSet = new Set(templateProps);

  const missingFields = templateProps.filter((p) => !schemaSet.has(p));
  const extraFields = schemaProps.filter((p) => !templateSet.has(p));

  const matched = templateProps.filter((p) => schemaSet.has(p)).length;
  const total = Math.max(templateProps.length, 1);
  const score = Math.round((matched / total) * 100);

  return { template, score, missingFields, extraFields };
}

export function rankTemplates(
  schema: Record<string, unknown>,
  templates: SchemaTemplate[]
): TemplateMatch[] {
  return templates
    .map((t) => matchTemplate(schema, t))
    .sort((a, b) => b.score - a.score);
}

export function applyTemplate(
  template: SchemaTemplate,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return { ...template.schema, ...overrides };
}

export function formatTemplateMatch(match: TemplateMatch): string {
  const lines: string[] = [
    `Template: ${match.template.name} (${match.template.id})`,
    `  Score: ${match.score}%`,
  ];
  if (match.missingFields.length > 0) {
    lines.push(`  Missing fields: ${match.missingFields.join(', ')}`);
  }
  if (match.extraFields.length > 0) {
    lines.push(`  Extra fields: ${match.extraFields.join(', ')}`);
  }
  return lines.join('\n');
}
