import {
  groupDiffsByChangeType,
  groupDiffsByPath,
  groupDiffsByDepth,
  flattenGroups,
  countByGroup,
} from './group';
import { SchemaDiff } from './types';

const makeDiff = (path: string, type: 'added' | 'removed' | 'changed', oldVal?: unknown, newVal?: unknown): SchemaDiff => ({
  path,
  type,
  oldValue: oldVal,
  newValue: newVal,
});

const diffs: SchemaDiff[] = [
  makeDiff('properties.name', 'added', undefined, { type: 'string' }),
  makeDiff('properties.age', 'removed', { type: 'number' }, undefined),
  makeDiff('properties.email.type', 'changed', 'string', 'integer'),
  makeDiff('required', 'changed', ['id'], ['id', 'name']),
];

describe('groupDiffsByChangeType', () => {
  it('separates diffs into correct groups', () => {
    const grouped = groupDiffsByChangeType(diffs);
    expect(grouped.additions).toHaveLength(1);
    expect(grouped.removals).toHaveLength(1);
    expect(grouped.modifications).toHaveLength(2);
    expect(grouped.renames).toHaveLength(0);
  });

  it('returns empty groups for empty input', () => {
    const grouped = groupDiffsByChangeType([]);
    expect(grouped.additions).toHaveLength(0);
    expect(grouped.removals).toHaveLength(0);
    expect(grouped.modifications).toHaveLength(0);
  });
});

describe('groupDiffsByPath', () => {
  it('groups by top-level path segment', () => {
    const grouped = groupDiffsByPath(diffs);
    expect(grouped['properties']).toHaveLength(3);
    expect(grouped['required']).toHaveLength(1);
  });

  it('uses (root) for empty path', () => {
    const rootDiff = makeDiff('', 'changed', 'a', 'b');
    const grouped = groupDiffsByPath([rootDiff]);
    expect(grouped['(root)']).toHaveLength(1);
  });
});

describe('groupDiffsByDepth', () => {
  it('groups diffs by nesting depth', () => {
    const grouped = groupDiffsByDepth(diffs);
    expect(grouped[1]).toHaveLength(2); // properties.name, properties.age, required
    expect(grouped[2]).toHaveLength(1); // properties.email.type
  });

  it('places root-level diffs at depth 0', () => {
    const rootDiff = makeDiff('', 'changed', 'a', 'b');
    const grouped = groupDiffsByDepth([rootDiff]);
    expect(grouped[0]).toHaveLength(1);
  });
});

describe('flattenGroups', () => {
  it('returns all diffs in order: additions, removals, modifications, renames', () => {
    const grouped = groupDiffsByChangeType(diffs);
    const flat = flattenGroups(grouped);
    expect(flat).toHaveLength(diffs.length);
    expect(flat[0].type).toBe('added');
    expect(flat[1].type).toBe('removed');
  });
});

describe('countByGroup', () => {
  it('returns correct counts per group', () => {
    const grouped = groupDiffsByChangeType(diffs);
    const counts = countByGroup(grouped);
    expect(counts.additions).toBe(1);
    expect(counts.removals).toBe(1);
    expect(counts.modifications).toBe(2);
    expect(counts.renames).toBe(0);
  });
});
