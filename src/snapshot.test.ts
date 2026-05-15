import { describe, it, expect } from 'vitest';
import {
  createSnapshot,
  createSnapshotStore,
  addSnapshot,
  findSnapshotById,
  findSnapshotsByTag,
  getLatestSnapshot,
  removeSnapshot,
  listSnapshots,
} from './snapshot';
import { JSONSchema } from './types';

const schema: JSONSchema = {
  type: 'object',
  properties: { name: { type: 'string' } },
};

describe('createSnapshot', () => {
  it('creates a snapshot with required fields', () => {
    const snap = createSnapshot(schema, 'v1');
    expect(snap.id).toBeTruthy();
    expect(snap.label).toBe('v1');
    expect(snap.schema).toEqual(schema);
    expect(snap.tags).toEqual([]);
    expect(snap.createdAt).toBeTruthy();
  });

  it('deep clones the schema', () => {
    const snap = createSnapshot(schema, 'v1');
    expect(snap.schema).not.toBe(schema);
  });

  it('includes provided tags', () => {
    const snap = createSnapshot(schema, 'v1', ['stable', 'prod']);
    expect(snap.tags).toEqual(['stable', 'prod']);
  });
});

describe('SnapshotStore', () => {
  it('starts empty', () => {
    const store = createSnapshotStore();
    expect(store.snapshots).toHaveLength(0);
  });

  it('adds snapshots immutably', () => {
    const store = createSnapshotStore();
    const snap = createSnapshot(schema, 'v1');
    const updated = addSnapshot(store, snap);
    expect(updated.snapshots).toHaveLength(1);
    expect(store.snapshots).toHaveLength(0);
  });

  it('finds snapshot by id', () => {
    const snap = createSnapshot(schema, 'v1');
    const store = addSnapshot(createSnapshotStore(), snap);
    expect(findSnapshotById(store, snap.id)).toEqual(snap);
    expect(findSnapshotById(store, 'missing')).toBeUndefined();
  });

  it('finds snapshots by tag', () => {
    const s1 = createSnapshot(schema, 'v1', ['stable']);
    const s2 = createSnapshot(schema, 'v2', ['beta']);
    const s3 = createSnapshot(schema, 'v3', ['stable']);
    let store = createSnapshotStore();
    store = addSnapshot(addSnapshot(addSnapshot(store, s1), s2), s3);
    expect(findSnapshotsByTag(store, 'stable')).toHaveLength(2);
    expect(findSnapshotsByTag(store, 'beta')).toHaveLength(1);
  });

  it('returns latest snapshot', () => {
    const s1 = createSnapshot(schema, 'v1');
    const s2 = createSnapshot(schema, 'v2');
    const store = addSnapshot(addSnapshot(createSnapshotStore(), s1), s2);
    expect(getLatestSnapshot(store)).toEqual(s2);
  });

  it('removes a snapshot by id', () => {
    const snap = createSnapshot(schema, 'v1');
    const store = addSnapshot(createSnapshotStore(), snap);
    const updated = removeSnapshot(store, snap.id);
    expect(updated.snapshots).toHaveLength(0);
  });

  it('lists all snapshots as a copy', () => {
    const snap = createSnapshot(schema, 'v1');
    const store = addSnapshot(createSnapshotStore(), snap);
    const list = listSnapshots(store);
    expect(list).toHaveLength(1);
    expect(list).not.toBe(store.snapshots);
  });
});
