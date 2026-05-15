import { JSONSchema, SchemaDiff } from './types';

export interface LintRule {
  id: string;
  message: string;
  check: (schema: JSONSchema) => boolean;
}

export interface LintResult {
  ruleId: string;
  message: string;
  severity: 'warning' | 'error';
  path?: string;
}

export interface LintReport {
  schema: JSONSchema;
  results: LintResult[];
  passed: boolean;
}

const builtinRules: LintRule[] = [
  {
    id: 'require-type',
    message: 'Schema should define a "type" property',
    check: (schema) => typeof schema.type === 'string' || Array.isArray(schema.type),
  },
  {
    id: 'require-description',
    message: 'Schema should include a "description" field',
    check: (schema) => typeof schema.description === 'string' && schema.description.length > 0,
  },
  {
    id: 'no-empty-properties',
    message: 'Object schema with "properties" should define at least one property',
    check: (schema) =>
      schema.type !== 'object' ||
      !schema.properties ||
      Object.keys(schema.properties).length > 0,
  },
  {
    id: 'array-requires-items',
    message: 'Array schema should define an "items" property',
    check: (schema) => schema.type !== 'array' || schema.items !== undefined,
  },
  {
    id: 'no-additional-properties-missing',
    message: 'Object schema should explicitly set "additionalProperties"',
    check: (schema) =>
      schema.type !== 'object' || schema.additionalProperties !== undefined,
  },
];

export function lintSchema(
  schema: JSONSchema,
  rules: LintRule[] = builtinRules
): LintReport {
  const results: LintResult[] = rules
    .filter((rule) => !rule.check(schema))
    .map((rule) => ({
      ruleId: rule.id,
      message: rule.message,
      severity: 'warning' as const,
    }));

  return {
    schema,
    results,
    passed: results.length === 0,
  };
}

export function lintDiff(diffs: SchemaDiff[]): LintResult[] {
  const results: LintResult[] = [];

  for (const diff of diffs) {
    if (diff.type === 'removed' && diff.path.includes('required')) {
      results.push({
        ruleId: 'breaking-required-removal',
        message: `Removing required field at path "${diff.path}" may break existing consumers`,
        severity: 'error',
        path: diff.path,
      });
    }

    if (diff.type === 'changed' && diff.path.endsWith('/type')) {
      results.push({
        ruleId: 'breaking-type-change',
        message: `Type change at "${diff.path}" from "${diff.oldValue}" to "${diff.newValue}" is potentially breaking`,
        severity: 'error',
        path: diff.path,
      });
    }
  }

  return results;
}

export function formatLintReport(report: LintReport): string {
  if (report.passed) return '✅ Schema passed all lint checks.';
  const lines = report.results.map(
    (r) => `  [${r.severity.toUpperCase()}] ${r.ruleId}: ${r.message}`
  );
  return `❌ Schema lint failed:\n${lines.join('\n')}`;
}
