import { describe, it, expect } from 'vitest';
import {
  createSnapshot,
  createSnapshotStore,
  addSnapshot,
  getLatestSnapshot,
  findSnapshotById,
} from './snapshot';
import { diffSchemas } from './diff';
import { generateReport } from './report';
import { JSONSchema } from './types';

describe('snapshot integration', () => {
  it('diffs two snapshots and generates a report', () => {
    const v1: JSONSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    const v2: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
      required: ['name'],
    };

    let store = createSnapshotStore();
    store = addSnapshot(store, createSnapshot(v1, 'v1.0', ['stable']));
    store = addSnapshot(store, createSnapshot(v2, 'v2.0', ['latest']));

    const latest = getLatestSnapshot(store)!;
    const previous = findSnapshotById(store, store.snapshots[0].id)!;

    const diffs = diffSchemas(previous.schema, latest.schema);
    const report = generateReport(diffs);

    expect(diffs.length).toBeGreaterThan(0);
    expect(report).toContain('age');
  });

  it('handles an empty store gracefully', () => {
    const store = createSnapshotStore();
    expect(getLatestSnapshot(store)).toBeUndefined();
  });

  it('tracks schema evolution across multiple snapshots', () => {
    const schemas: JSONSchema[] = [
      { type: 'object', properties: { a: { type: 'string' } } },
      { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } } },
      { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' }, c: { type: 'boolean' } } },
    ];

    let store = createSnapshotStore();
    schemas.forEach((s, i) => {
      store = addSnapshot(store, createSnapshot(s, `v${i + 1}`));
    });

    expect(store.snapshots).toHaveLength(3);

    const diffs01 = diffSchemas(store.snapshots[0].schema, store.snapshots[1].schema);
    const diffs12 = diffSchemas(store.snapshots[1].schema, store.snapshots[2].schema);

    expect(diffs01.some((d) => d.path.includes('b'))).toBe(true);
    expect(diffs12.some((d) => d.path.includes('c'))).toBe(true);
  });
});
