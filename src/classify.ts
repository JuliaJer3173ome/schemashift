import { SchemaDiff } from './types';

export type ChangeCategory =
  | 'structural'
  | 'constraint'
  | 'metadata'
  | 'type'
  | 'unknown';

export interface ClassifiedDiff {
  diff: SchemaDiff;
  category: ChangeCategory;
  severity: 'low' | 'medium' | 'high';
  rationale: string;
}

const METADATA_KEYS = new Set(['title', 'description', 'examples', 'default', '$comment']);
const CONSTRAINT_KEYS = new Set([
  'minimum', 'maximum', 'minLength', 'maxLength',
  'minItems', 'maxItems', 'pattern', 'enum', 'const',
  'minProperties', 'maxProperties', 'multipleOf',
]);
const STRUCTURAL_KEYS = new Set(['required', 'properties', 'additionalProperties', 'allOf', 'anyOf', 'oneOf', 'not']);

export function classifyChange(diff: SchemaDiff): ClassifiedDiff {
  const key = diff.path.split('.').pop() ?? '';

  if (key === 'type' || diff.path.endsWith('/type')) {
    return { diff, category: 'type', severity: 'high', rationale: 'Type changes break consumers expecting a specific data type.' };
  }

  if (METADATA_KEYS.has(key)) {
    return { diff, category: 'metadata', severity: 'low', rationale: 'Metadata changes are informational and rarely breaking.' };
  }

  if (CONSTRAINT_KEYS.has(key)) {
    const severity = diff.type === 'removed' ? 'medium' : 'high';
    return { diff, category: 'constraint', severity, rationale: 'Constraint changes affect validation behaviour.' };
  }

  if (STRUCTURAL_KEYS.has(key)) {
    return { diff, category: 'structural', severity: 'high', rationale: 'Structural changes alter the schema shape and may break compatibility.' };
  }

  return { diff, category: 'unknown', severity: 'medium', rationale: 'Change could not be categorised automatically.' };
}

export function classifyDiffs(diffs: SchemaDiff[]): ClassifiedDiff[] {
  return diffs.map(classifyChange);
}

export function groupByCategory(classified: ClassifiedDiff[]): Record<ChangeCategory, ClassifiedDiff[]> {
  const result: Record<ChangeCategory, ClassifiedDiff[]> = {
    structural: [],
    constraint: [],
    metadata: [],
    type: [],
    unknown: [],
  };
  for (const item of classified) {
    result[item.category].push(item);
  }
  return result;
}

export function formatClassification(classified: ClassifiedDiff[]): string {
  const grouped = groupByCategory(classified);
  const lines: string[] = ['## Change Classification\n'];
  for (const [category, items] of Object.entries(grouped)) {
    if (items.length === 0) continue;
    lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})`);
    for (const { diff, severity, rationale } of items) {
      lines.push(`- [${severity.toUpperCase()}] \`${diff.path}\` (${diff.type}): ${rationale}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
