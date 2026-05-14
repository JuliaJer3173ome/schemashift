import {
  diffSchemas,
  generateReport,
  generateMigrations,
  applyMigrations,
  hasBreakingChanges,
  validateSchema,
  validateDiffSchemas,
} from './index';

const sourceSchema = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const },
    age: { type: 'integer' as const },
  },
  required: ['name'],
};

const targetSchema = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' as const },
    age: { type: 'number' as const },
    email: { type: 'string' as const },
  },
  required: ['name', 'email'],
};

describe('schemashift public API', () => {
  it('exports diffSchemas and produces diffs', () => {
    const diffs = diffSchemas(sourceSchema, targetSchema);
    expect(Array.isArray(diffs)).toBe(true);
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('exports generateReport and produces a string report', () => {
    const diffs = diffSchemas(sourceSchema, targetSchema);
    const report = generateReport(diffs);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it('exports generateMigrations and produces migration steps', () => {
    const diffs = diffSchemas(sourceSchema, targetSchema);
    const plan = generateMigrations(diffs);
    expect(plan).toHaveProperty('steps');
    expect(plan).toHaveProperty('hasBreaking');
  });

  it('exports hasBreakingChanges', () => {
    const diffs = diffSchemas(sourceSchema, targetSchema);
    const breaking = hasBreakingChanges(diffs);
    expect(typeof breaking).toBe('boolean');
  });

  it('exports validateSchema', () => {
    const result = validateSchema(sourceSchema);
    expect(result.valid).toBe(true);
  });

  it('exports validateDiffSchemas', () => {
    const result = validateDiffSchemas(sourceSchema, targetSchema);
    expect(result.canDiff).toBe(true);
  });

  it('full pipeline: validate -> diff -> migrate -> report', () => {
    const { canDiff } = validateDiffSchemas(sourceSchema, targetSchema);
    expect(canDiff).toBe(true);

    const diffs = diffSchemas(sourceSchema, targetSchema);
    const plan = generateMigrations(diffs);
    const report = generateReport(diffs);

    expect(plan.steps.length).toBeGreaterThan(0);
    expect(report).toContain('Schema Diff Report');
  });
});
