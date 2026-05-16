import { describe, it, expect } from 'vitest';
import { exportDiff, exportSchema, exportReport, ExportOptions } from './export';
import { SchemaDiff } from './types';

const sampleDiffs: SchemaDiff[] = [
  { path: 'properties.name', type: 'added', before: undefined, after: { type: 'string' } },
  { path: 'properties.age', type: 'removed', before: { type: 'number' }, after: undefined },
  { path: 'required', type: 'modified', before: ['id'], after: ['id', 'name'] },
];

describe('exportDiff', () => {
  it('exports diffs as json format', () => {
    const result = exportDiff(sampleDiffs, { format: 'json' });
    expect(result.format).toBe('json');
    expect(result.content).toBeTruthy();
    expect(result.generatedAt).toBeTruthy();
    const parsed = JSON.parse(result.content);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it('exports diffs as text format', () => {
    const result = exportDiff(sampleDiffs, { format: 'text' });
    expect(result.format).toBe('text');
    expect(typeof result.content).toBe('string');
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('exports diffs as markdown format', () => {
    const result = exportDiff(sampleDiffs, { format: 'markdown' });
    expect(result.format).toBe('markdown');
    expect(result.content).toContain('#');
  });

  it('exports diffs as changelog format', () => {
    const result = exportDiff(sampleDiffs, { format: 'changelog', title: 'v2.0', version: '2.0.0' });
    expect(result.format).toBe('changelog');
    expect(result.content).toBeTruthy();
  });

  it('includes metadata when requested', () => {
    const result = exportDiff(sampleDiffs, { format: 'json', includeMetadata: true });
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.totalChanges).toBe(3);
  });

  it('does not include metadata by default', () => {
    const result = exportDiff(sampleDiffs, { format: 'json' });
    expect(result.metadata).toBeUndefined();
  });

  it('sets generatedAt as ISO string', () => {
    const result = exportDiff(sampleDiffs, { format: 'text' });
    expect(() => new Date(result.generatedAt)).not.toThrow();
  });
});

describe('exportSchema', () => {
  const schema = { type: 'object', properties: { id: { type: 'string' } } };

  it('exports schema as json string', () => {
    const output = exportSchema(schema, 'json');
    const parsed = JSON.parse(output);
    expect(parsed.type).toBe('object');
  });

  it('exports schema as text', () => {
    const output = exportSchema(schema, 'text');
    expect(output).toContain('type');
  });

  it('defaults to json format', () => {
    const output = exportSchema(schema);
    expect(() => JSON.parse(output)).not.toThrow();
  });
});

describe('exportReport', () => {
  const before = { type: 'object', properties: { id: { type: 'string' } } };
  const after = { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } };

  it('returns a combined report string', () => {
    const result = exportReport(before, after, sampleDiffs, { format: 'text' });
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.format).toBe('text');
  });
});
