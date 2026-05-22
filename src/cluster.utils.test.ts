import { describe, it, expect } from 'vitest';
import {
  mergeClusters,
  sortClusters,
  topClusters,
  clusterSummary,
  filterEmptyClusters,
} from './cluster.utils';
import { Cluster } from './cluster';

const c1: Cluster = { label: 'user', diffs: [{} as any, {} as any], size: 2 };
const c2: Cluster = { label: 'order', diffs: [{} as any, {} as any, {} as any], size: 3 };
const c3: Cluster = { label: 'product', diffs: [{} as any], size: 1 };
const empty: Cluster = { label: 'empty', diffs: [], size: 0 };

describe('mergeClusters', () => {
  it('merges two cluster arrays by label', () => {
    const extra: Cluster = { label: 'user', diffs: [{} as any], size: 1 };
    const merged = mergeClusters([c1], [extra]);
    const user = merged.find((c) => c.label === 'user');
    expect(user?.size).toBe(3);
  });

  it('includes unique labels from both arrays', () => {
    const merged = mergeClusters([c1], [c2]);
    expect(merged.map((c) => c.label)).toContain('order');
  });
});

describe('sortClusters', () => {
  it('sorts by size descending by default', () => {
    const sorted = sortClusters([c3, c1, c2]);
    expect(sorted[0].label).toBe('order');
  });

  it('sorts by label alphabetically', () => {
    const sorted = sortClusters([c2, c1, c3], 'label');
    expect(sorted[0].label).toBe('order');
  });
});

describe('topClusters', () => {
  it('returns top N clusters by size', () => {
    const top = topClusters([c3, c1, c2], 2);
    expect(top).toHaveLength(2);
    expect(top[0].label).toBe('order');
  });
});

describe('clusterSummary', () => {
  it('returns label to size map', () => {
    const summary = clusterSummary([c1, c2]);
    expect(summary).toEqual({ user: 2, order: 3 });
  });
});

describe('filterEmptyClusters', () => {
  it('removes clusters with size 0', () => {
    const result = filterEmptyClusters([c1, empty, c2]);
    expect(result).not.toContainEqual(empty);
    expect(result).toHaveLength(2);
  });
});
