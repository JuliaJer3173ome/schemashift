import { describe, it, expect } from 'vitest';
import {
  clusterByPath,
  clusterByChangeType,
  clusterDiffs,
  formatClusters,
} from './cluster';
import { SchemaDiff } from './types';

const diffs: SchemaDiff[] = [
  { type: 'added', path: 'user.name', before: undefined, after: 'string' },
  { type: 'added', path: 'user.age', before: undefined, after: 'number' },
  { type: 'removed', path: 'legacy.id', before: 'string', after: undefined },
  { type: 'changed', path: 'user.email', before: 'string', after: 'null' },
];

describe('clusterByPath', () => {
  it('groups diffs by top-level path segment', () => {
    const clusters = clusterByPath(diffs, 1);
    const labels = clusters.map((c) => c.label);
    expect(labels).toContain('user');
    expect(labels).toContain('legacy');
  });

  it('user cluster has 3 diffs', () => {
    const clusters = clusterByPath(diffs, 1);
    const user = clusters.find((c) => c.label === 'user');
    expect(user?.size).toBe(3);
  });
});

describe('clusterByChangeType', () => {
  it('groups by type', () => {
    const clusters = clusterByChangeType(diffs);
    const labels = clusters.map((c) => c.label);
    expect(labels).toContain('added');
    expect(labels).toContain('removed');
    expect(labels).toContain('changed');
  });

  it('added cluster has 2 diffs', () => {
    const clusters = clusterByChangeType(diffs);
    const added = clusters.find((c) => c.label === 'added');
    expect(added?.size).toBe(2);
  });
});

describe('clusterDiffs', () => {
  it('uses custom key function', () => {
    const clusters = clusterDiffs(diffs, { key: (d) => d.path.split('.')[0] });
    expect(clusters.map((c) => c.label)).toContain('user');
  });

  it('filters by minSize', () => {
    const clusters = clusterDiffs(diffs, { minSize: 3 });
    expect(clusters.every((c) => c.size >= 3)).toBe(true);
  });
});

describe('formatClusters', () => {
  it('returns no clusters message for empty array', () => {
    expect(formatClusters([])).toBe('No clusters found.');
  });

  it('formats cluster list', () => {
    const clusters = clusterByChangeType(diffs);
    const out = formatClusters(clusters);
    expect(out).toContain('[added]');
  });
});
