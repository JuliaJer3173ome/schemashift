import { SchemaDiff } from './types';

export interface ClusterOptions {
  minSize?: number;
  key?: (diff: SchemaDiff) => string;
}

export interface Cluster {
  label: string;
  diffs: SchemaDiff[];
  size: number;
}

export function clusterByPath(diffs: SchemaDiff[], depth = 1): Cluster[] {
  const map = new Map<string, SchemaDiff[]>();
  for (const diff of diffs) {
    const parts = diff.path.split('.').slice(0, depth);
    const key = parts.join('.') || '(root)';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(diff);
  }
  return Array.from(map.entries()).map(([label, ds]) => ({
    label,
    diffs: ds,
    size: ds.length,
  }));
}

export function clusterByChangeType(diffs: SchemaDiff[]): Cluster[] {
  const map = new Map<string, SchemaDiff[]>();
  for (const diff of diffs) {
    const key = diff.type;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(diff);
  }
  return Array.from(map.entries()).map(([label, ds]) => ({
    label,
    diffs: ds,
    size: ds.length,
  }));
}

export function clusterDiffs(
  diffs: SchemaDiff[],
  options: ClusterOptions = {}
): Cluster[] {
  const { minSize = 1, key } = options;
  const map = new Map<string, SchemaDiff[]>();
  for (const diff of diffs) {
    const label = key ? key(diff) : diff.type;
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(diff);
  }
  return Array.from(map.entries())
    .map(([label, ds]) => ({ label, diffs: ds, size: ds.length }))
    .filter((c) => c.size >= minSize);
}

export function formatClusters(clusters: Cluster[]): string {
  if (clusters.length === 0) return 'No clusters found.';
  return clusters
    .map((c) => `[${c.label}] (${c.size} change${c.size !== 1 ? 's' : ''})`)
    .join('\n');
}
