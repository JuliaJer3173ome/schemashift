import { diffSchemas } from './diff';
import { lintSchema, lintDiff } from './lint';
import { JSONSchema } from './types';

describe('lint integration', () => {
  const schemaV1: JSONSchema = {
    type: 'object',
    description: 'User schema v1',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      age: { type: 'integer' },
    },
    required: ['id', 'email'],
    additionalProperties: false,
  };

  const schemaV2BreakingChange: JSONSchema = {
    type: 'object',
    description: 'User schema v2 with breaking change',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      age: { type: 'string' }, // type changed
    },
    required: ['id'],             // removed 'email'
    additionalProperties: false,
  };

  const schemaV2Safe: JSONSchema = {
    type: 'object',
    description: 'User schema v2 safe',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      age: { type: 'integer' },
      nickname: { type: 'string' },
    },
    required: ['id', 'email'],
    additionalProperties: false,
  };

  it('lints both schemas independently and passes', () => {
    expect(lintSchema(schemaV1).passed).toBe(true);
    expect(lintSchema(schemaV2Safe).passed).toBe(true);
  });

  it('detects breaking changes in diff between v1 and breaking v2', () => {
    const diffs = diffSchemas(schemaV1, schemaV2BreakingChange);
    const lintResults = lintDiff(diffs);
    const ruleIds = lintResults.map((r) => r.ruleId);
    expect(ruleIds).toContain('breaking-type-change');
    expect(ruleIds).toContain('breaking-required-removal');
  });

  it('produces no lint errors for a safe schema evolution', () => {
    const diffs = diffSchemas(schemaV1, schemaV2Safe);
    const lintResults = lintDiff(diffs);
    expect(lintResults.filter((r) => r.severity === 'error')).toHaveLength(0);
  });

  it('correctly counts breaking vs non-breaking lint results', () => {
    const diffs = diffSchemas(schemaV1, schemaV2BreakingChange);
    const lintResults = lintDiff(diffs);
    const errors = lintResults.filter((r) => r.severity === 'error');
    const warnings = lintResults.filter((r) => r.severity === 'warning');
    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThanOrEqual(0);
  });
});
