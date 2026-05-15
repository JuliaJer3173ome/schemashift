import { SchemaSnapshot, SnapshotStore } from './snapshot';
import { diffSchemas } from './diff';
import { SchemaDiff } from './types';

export interface SnapshotDiffResult {
  from: SchemaSnapshot;
  to: SchemaSnapshot;
  diffs: SchemaDiff[];
}

export function diffSnapshots(
  from: SchemaSnapshot,
  to: SchemaSnapshot
): SnapshotDiffResult {
  return {
    from,
    to,
    diffs: diffSchemas(from.schema, to.schema),
  };
}

export function diffAdjacentSnapshots(
  store: SnapshotStore
): SnapshotDiffResult[] {
  const results: SnapshotDiffResult[] = [];
  for (let i = 0; i < store.snapshots.length - 1; i++) {
    results.push(diffSnapshots(store.snapshots[i], store.snapshots[i + 1]));
  }
  return results;
}

export function findSnapshotPairByLabels(
  store: SnapshotStore,
  fromLabel: string,
  toLabel: string
): [SchemaSnapshot, SchemaSnapshot] | undefined {
  const from = store.snapshots.find((s) => s.label === fromLabel);
  const to = store.snapshots.find((s) => s.label === toLabel);
  if (!from || !to) return undefined;
  return [from, to];
}

export function snapshotHasChanges(
  from: SchemaSnapshot,
  to: SchemaSnapshot
): boolean {
  return diffSchemas(from.schema, to.schema).length > 0;
}

export function countChangesAcrossHistory(
  store: SnapshotStore
): number {
  return diffAdjacentSnapshots(store).reduce(
    (sum, r) => sum + r.diffs.length,
    0
  );
}
