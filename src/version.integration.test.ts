import { createVersionBump, compareVersions, bumpVersion, makeVersion } from './version';
import { SchemaVersion } from './version';

const makeVer = (version: string, schema = {}): SchemaVersion => ({
  version,
  schema,
  createdAt: new Date().toISOString(),
});

describe('version integration', () => {
  it('tracks a sequence of schema versions', () => {
    const v1 = makeVer('1.0.0', {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    });

    const schema2 = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id'],
    };
    const bump1 = createVersionBump(v1, schema2, 'added name');
    expect(bump1.type).toBe('minor');
    expect(bump1.to).toBe('1.1.0');

    const v2 = bump1.next;
    const schema3 = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id', 'name'],
    };
    const bump2 = createVersionBump(v2, schema3, 'name now required');
    expect(bump2.type).toBe('patch');
    expect(bump2.to).toBe('1.1.1');

    const v3 = bump2.next;
    const schema4 = {
      type: 'object',
      properties: { uid: { type: 'string' }, name: { type: 'string' } },
      required: ['uid', 'name'],
    };
    const bump3 = createVersionBump(v3, schema4, 'renamed id to uid');
    expect(bump3.type).toBe('major');
    expect(bump3.to).toBe('2.0.0');

    const versions = [v1, v2, v3, bump3.next];
    const sorted = [...versions].sort((a, b) =>
      compareVersions(a.version, b.version)
    );
    expect(sorted.map((v) => v.version)).toEqual(['1.0.0', '1.1.0', '1.1.1', '2.0.0']);
  });

  it('handles no-change bump as patch', () => {
    const v1 = makeVer('3.0.0', { type: 'object' });
    const bump = createVersionBump(v1, { type: 'object' });
    expect(bump.type).toBe('patch');
    expect(bump.to).toBe('3.0.1');
    expect(bump.diffs).toHaveLength(0);
  });
});
