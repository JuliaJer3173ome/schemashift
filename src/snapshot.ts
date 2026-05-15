import { JSONSchema } from './types';
import { generateId } from './history';

export interface SchemaSnapshot {
  id: string;
  label: string;
  schema: JSONSchema;
  createdAt: string;
  tags: string[];
}

export interface SnapshotStore {
  snapshots: SchemaSnapshot[];
}

export function createSnapshot(
  schema: JSONSchema,
  label: string,
  tags: string[] = []
): SchemaSnapshot {
  return {
    id: generateId(),
    label,
    schema: structuredClone(schema),
    createdAt: new Date().toISOString(),
    tags,
  };
}

export function createSnapshotStore(): SnapshotStore {
  return { snapshots: [] };
}

export function addSnapshot(
  store: SnapshotStore,
  snapshot: SchemaSnapshot
): SnapshotStore {
  return { snapshots: [...store.snapshots, snapshot] };
}

export function findSnapshotById(
  store: SnapshotStore,
  id: string
): SchemaSnapshot | undefined {
  return store.snapshots.find((s) => s.id === id);
}

export function findSnapshotsByTag(
  store: SnapshotStore,
  tag: string
): SchemaSnapshot[] {
  return store.snapshots.filter((s) => s.tags.includes(tag));
}

export function getLatestSnapshot(
  store: SnapshotStore
): SchemaSnapshot | undefined {
  if (store.snapshots.length === 0) return undefined;
  return store.snapshots[store.snapshots.length - 1];
}

export function removeSnapshot(
  store: SnapshotStore,
  id: string
): SnapshotStore {
  return { snapshots: store.snapshots.filter((s) => s.id !== id) };
}

export function listSnapshots(store: SnapshotStore): SchemaSnapshot[] {
  return [...store.snapshots];
}
