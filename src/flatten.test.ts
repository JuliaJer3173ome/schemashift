import { flattenSchema, flattenDiff, formatFlatSchema } from './flatten';
import { SchemaDiff } from './types';

const simpleSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string', description: 'Unique identifier' },
    name: { type: 'string' },
    age: { type: 'number', default: 0 },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

describe('flattenSchema', () => {
  it('returns root entry', () => {
    const result = flattenSchema(simpleSchema);
    expect(result[0].path).toBe('(root)');
  });

  it('flattens nested properties', () => {
    const result = flattenSchema(simpleSchema);
    const paths = result.map((r) => r.path);
    expect(paths).toContain('id');
    expect(paths).toContain('name');
    expect(paths).toContain('age');
  });

  it('marks required fields correctly', () => {
    const result = flattenSchema(simpleSchema);
    const id = result.find((r) => r.path === 'id');
    const age = result.find((r) => r.path === 'age');
    expect(id?.required).toBe(true);
    expect(age?.required).toBe(false);
  });

  it('flattens array items with [] suffix', () => {
    const result = flattenSchema(simpleSchema);
    const paths = result.map((r) => r.path);
    expect(paths).toContain('tags[]');
  });

  it('preserves description', () => {
    const result = flattenSchema(simpleSchema);
    const id = result.find((r) => r.path === 'id');
    expect(id?.description).toBe('Unique identifier');
  });
});

describe('flattenDiff', () => {
  it('groups diffs by path', () => {
    const diffs: SchemaDiff[] = [
      { type: 'changed', path: 'name', before: 'string', after: 'number' },
      { type: 'added', path: 'email', before: undefined, after: 'string' },
      { type: 'changed', path: 'name', before: 'required', after: 'optional' },
    ];
    const grouped = flattenDiff(diffs);
    expect(grouped['name']).toHaveLength(2);
    expect(grouped['email']).toHaveLength(1);
  });
});

describe('formatFlatSchema', () => {
  it('formats entries as readable strings', () => {
    const result = flattenSchema(simpleSchema);
    const output = formatFlatSchema(result);
    expect(output).toContain('id: string (required)');
    expect(output).toContain('age: number');
  });

  it('includes description when present', () => {
    const result = flattenSchema(simpleSchema);
    const output = formatFlatSchema(result);
    expect(output).toContain('— Unique identifier');
  });
});
