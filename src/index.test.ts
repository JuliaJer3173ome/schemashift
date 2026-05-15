import {
  diffSchemas,
  generateReport,
  generateMigrations,
  hasBreakingChanges,
  validateSchema,
  formatOutput,
  applyPatch,
  revertPatch,
} from './index';

const schemaV1 = {
  type: 'object' as const,
  properties: {
    id: { type: 'integer' as const },
    name: { type: 'string' as const },
  },
  required: ['id', 'name'],
};

const schemaV2 = {
  type: 'object' as const,
  properties: {
    id: { type: 'integer' as const },
    name: { type: 'string' as const },
    email: { type: 'string' as const },
  },
  required: ['id', 'name', 'email'],
};

describe('index exports', () => {
  it('exports diffSchemas', () => {
    expect(typeof diffSchemas).toBe('function');
  });

  it('exports generateReport', () => {
    expect(typeof generateReport).toBe('function');
  });

  it('exports generateMigrations', () => {
    expect(typeof generateMigrations).toBe('function');
  });

  it('exports hasBreakingChanges', () => {
    expect(typeof hasBreakingChanges).toBe('function');
  });

  it('exports validateSchema', () => {
    expect(typeof validateSchema).toBe('function');
  });

  it('exports formatOutput', () => {
    expect(typeof formatOutput).toBe('function');
  });

  it('exports applyPatch', () => {
    expect(typeof applyPatch).toBe('function');
  });

  it('exports revertPatch', () => {
    expect(typeof revertPatch).toBe('function');
  });

  it('full workflow: diff -> patch -> revert', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    expect(diffs.length).toBeGreaterThan(0);

    const { schema: patched, applied } = applyPatch(schemaV1, diffs);
    expect(applied.length).toBeGreaterThan(0);
    expect((patched as any).properties?.email).toBeDefined();

    const { schema: reverted } = revertPatch(patched, diffs);
    expect((reverted as any).properties?.email).toBeUndefined();
  });

  it('full workflow: diff -> migrations -> report', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const migrations = generateMigrations(diffs);
    expect(migrations.length).toBeGreaterThan(0);

    const breaking = hasBreakingChanges(diffs);
    expect(typeof breaking).toBe('boolean');

    const report = generateReport(diffs);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });
});
