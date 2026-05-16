import { describe, it, expect } from 'vitest';
import { exportDiff, exportReport } from './export';
import { diffSchemas } from './diff';

const schemaV1 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
  },
  required: ['id'],
};

const schemaV2 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    username: { type: 'string' },
  },
  required: ['id', 'username'],
};

describe('export integration', () => {
  it('diffs two schemas and exports as json', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const result = exportDiff(diffs, { format: 'json', includeMetadata: true });
    const parsed = JSON.parse(result.content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(result.metadata?.totalChanges).toBeGreaterThan(0);
  });

  it('diffs two schemas and exports as markdown', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const result = exportDiff(diffs, { format: 'markdown' });
    expect(result.content).toContain('#');
  });

  it('diffs two schemas and exports as changelog with version info', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const result = exportDiff(diffs, {
      format: 'changelog',
      title: 'Schema Update',
      version: '2.0.0',
      includeMetadata: true,
    });
    expect(result.content).toBeTruthy();
    expect(result.metadata?.version).toBe('2.0.0');
  });

  it('generates a full report from real schema diff', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const result = exportReport(schemaV1, schemaV2, diffs, {
      format: 'text',
      includeMetadata: true,
    });
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.metadata?.totalChanges).toBeGreaterThan(0);
  });

  it('produces consistent output for same inputs', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const r1 = exportDiff(diffs, { format: 'text' });
    const r2 = exportDiff(diffs, { format: 'text' });
    expect(r1.content).toBe(r2.content);
  });
});
