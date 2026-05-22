import { Cluster } from './cluster';
import { SchemaDiff } from './types';

export function mergeClusters(a: Cluster[], b: Cluster[]): Cluster[] {
  const map = new Map<string, SchemaDiff[]>();
  for (const c of [...a, ...b]) {
    if (!map.has(c.label)) map.set(c.label, []);
    map.get(c.label)!.push(...c.diffs);
  }
  return Array.from(map.entries()).map(([label, diffs]) => ({
    label,
    diffs,
    size: diffs.length,
  }));
}

export function sortClusters(
  clusters: Cluster[],
  by: 'size' | 'label' = 'size'
): Cluster[] {
  return [...clusters].sort((a, b) =>
    by === 'size' ? b.size - a.size : a.label.localeCompare(b.label)
  );
}

export function topClusters(clusters: Cluster[], n = 3): Cluster[] {
  return sortClusters(clusters).slice(0, n);
}

export function clusterSummary(clusters: Cluster[]): Record<string, number> {
  return Object.fromEntries(clusters.map((c) => [c.label, c.size]));
}

export function filterEmptyClusters(clusters: Cluster[]): Cluster[] {
  return clusters.filter((c) => c.size > 0);
}
