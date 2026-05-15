import { lintSchema, lintDiff, formatLintReport } from './lint';
import { JSONSchema, SchemaDiff } from './types';

const validSchema: JSONSchema = {
  type: 'object',
  description: 'A valid user schema',
  properties: { name: { type: 'string' } },
  additionalProperties: false,
};

const minimalSchema: JSONSchema = {
  type: 'string',
};

describe('lintSchema', () => {
  it('passes a well-formed schema', () => {
    const report = lintSchema(validSchema);
    expect(report.passed).toBe(true);
    expect(report.results).toHaveLength(0);
  });

  it('flags missing description', () => {
    const report = lintSchema(minimalSchema);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('require-description');
  });

  it('flags missing type', () => {
    const report = lintSchema({} as JSONSchema);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('require-type');
  });

  it('flags array schema missing items', () => {
    const report = lintSchema({ type: 'array' } as JSONSchema);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('array-requires-items');
  });

  it('flags object missing additionalProperties', () => {
    const schema: JSONSchema = {
      type: 'object',
      description: 'test',
      properties: { id: { type: 'string' } },
    };
    const report = lintSchema(schema);
    const ids = report.results.map((r) => r.ruleId);
    expect(ids).toContain('no-additional-properties-missing');
  });

  it('accepts custom rules', () => {
    const customRule = {
      id: 'custom-rule',
      message: 'Must have title',
      check: (s: JSONSchema) => typeof (s as any).title === 'string',
    };
    const report = lintSchema(validSchema, [customRule]);
    expect(report.passed).toBe(false);
    expect(report.results[0].ruleId).toBe('custom-rule');
  });
});

describe('lintDiff', () => {
  it('flags breaking type change', () => {
    const diffs: SchemaDiff[] = [
      { type: 'changed', path: '/properties/age/type', oldValue: 'integer', newValue: 'string' },
    ];
    const results = lintDiff(diffs);
    expect(results.some((r) => r.ruleId === 'breaking-type-change')).toBe(true);
  });

  it('flags required field removal', () => {
    const diffs: SchemaDiff[] = [
      { type: 'removed', path: '/required/0', oldValue: 'email', newValue: undefined },
    ];
    const results = lintDiff(diffs);
    expect(results.some((r) => r.ruleId === 'breaking-required-removal')).toBe(true);
  });

  it('returns empty array for safe diffs', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: '/properties/nickname', oldValue: undefined, newValue: { type: 'string' } },
    ];
    expect(lintDiff(diffs)).toHaveLength(0);
  });
});

describe('formatLintReport', () => {
  it('returns success message when passed', () => {
    const report = lintSchema(validSchema);
    expect(formatLintReport(report)).toContain('✅');
  });

  it('returns failure message with details', () => {
    const report = lintSchema({} as JSONSchema);
    const output = formatLintReport(report);
    expect(output).toContain('❌');
    expect(output).toContain('require-type');
  });
});
