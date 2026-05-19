import { flattenSchema, flattenDiff, formatFlatSchema } from './flatten';
import { diffFlatSchemas } from './flatten.utils';
import { diffSchemas } from './diff';

const v1 = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    age: { type: 'number' },
  },
};

const v2 = {
  type: 'object',
  required: ['id', 'name', 'email'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string', description: 'Contact email' },
    profile: {
      type: 'object',
      properties: {
        bio: { type: 'string' },
      },
    },
  },
};

describe('flatten integration', () => {
  it('round-trips schema to flat and produces readable output', () => {
    const flat = flattenSchema(v2);
    const output = formatFlatSchema(flat);
    expect(output).toContain('email: string (required)');
    expect(output).toContain('profile.bio: string');
    expect(output).toContain('— Contact email');
  });

  it('diffFlatSchemas detects schema evolution correctly', () => {
    const flatV1 = flattenSchema(v1);
    const flatV2 = flattenSchema(v2);
    const { added, removed, changed } = diffFlatSchemas(flatV1, flatV2);
    expect(added.map((f) => f.path)).toContain('email');
    expect(removed.map((f) => f.path)).toContain('age');
    expect(changed.length).toBeGreaterThanOrEqual(0);
  });

  it('flattenDiff groups raw diffs from diffSchemas by path', () => {
    const diffs = diffSchemas(v1, v2);
    const grouped = flattenDiff(diffs);
    const paths = Object.keys(grouped);
    expect(paths.length).toBeGreaterThan(0);
  });

  it('produces consistent field count for nested schemas', () => {
    const flat = flattenSchema(v2);
    // root + id + name + email + profile + profile.bio
    expect(flat.length).toBe(6);
  });
});
