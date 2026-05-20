import { diffSchemas } from './diff';
import { groupDiffsByChangeType, groupDiffsByPath, countByGroup } from './group';

const schemaV1 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    age: { type: 'number' },
  },
  required: ['id'],
};

const schemaV2 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'name'],
};

describe('group integration with diffSchemas', () => {
  let diffs: ReturnType<typeof diffSchemas>;

  beforeEach(() => {
    diffs = diffSchemas(schemaV1, schemaV2);
  });

  it('produces diffs that can be grouped by change type', () => {
    const grouped = groupDiffsByChangeType(diffs);
    const counts = countByGroup(grouped);
    expect(counts.additions + counts.removals + counts.modifications).toBe(diffs.length);
  });

  it('detects addition of email property', () => {
    const grouped = groupDiffsByChangeType(diffs);
    const addedPaths = grouped.additions.map((d) => d.path);
    expect(addedPaths.some((p) => p.includes('email'))).toBe(true);
  });

  it('detects removal of age property', () => {
    const grouped = groupDiffsByChangeType(diffs);
    const removedPaths = grouped.removals.map((d) => d.path);
    expect(removedPaths.some((p) => p.includes('age'))).toBe(true);
  });

  it('groups diffs by top-level path correctly', () => {
    const byPath = groupDiffsByPath(diffs);
    const topLevelKeys = Object.keys(byPath);
    expect(topLevelKeys).toContain('properties');
  });

  it('all diffs are accounted for after grouping by type', () => {
    const grouped = groupDiffsByChangeType(diffs);
    const total =
      grouped.additions.length +
      grouped.removals.length +
      grouped.modifications.length +
      grouped.renames.length;
    expect(total).toBe(diffs.length);
  });
});
