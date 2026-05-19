import { flattenSchema } from './flatten';
import {
  groupByDepth,
  findByPath,
  getRequiredFields,
  getOptionalFields,
  countByType,
  diffFlatSchemas,
} from './flatten.utils';

const schema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    count: { type: 'number' },
    meta: {
      type: 'object',
      properties: { label: { type: 'string' } },
    },
  },
};

const flat = flattenSchema(schema);

describe('groupByDepth', () => {
  it('puts root at depth 0', () => {
    const groups = groupByDepth(flat);
    expect(groups[0].some((f) => f.path === '(root)')).toBe(true);
  });

  it('puts top-level fields at depth 1', () => {
    const groups = groupByDepth(flat);
    expect(groups[1].map((f) => f.path)).toContain('id');
  });
});

describe('findByPath', () => {
  it('finds entry by exact path', () => {
    const entry = findByPath(flat, 'id');
    expect(entry?.type).toBe('string');
  });

  it('returns undefined for unknown path', () => {
    expect(findByPath(flat, 'nonexistent')).toBeUndefined();
  });
});

describe('getRequiredFields', () => {
  it('returns only required fields', () => {
    const required = getRequiredFields(flat);
    expect(required.every((f) => f.required)).toBe(true);
    expect(required.map((f) => f.path)).toContain('id');
  });
});

describe('getOptionalFields', () => {
  it('excludes required and root', () => {
    const optional = getOptionalFields(flat);
    expect(optional.map((f) => f.path)).toContain('count');
    expect(optional.map((f) => f.path)).not.toContain('id');
  });
});

describe('countByType', () => {
  it('counts occurrences per type', () => {
    const counts = countByType(flat);
    expect(counts['string']).toBeGreaterThanOrEqual(2);
    expect(counts['number']).toBe(1);
  });
});

describe('diffFlatSchemas', () => {
  it('detects added fields', () => {
    const after = flattenSchema({ ...schema, properties: { ...schema.properties, email: { type: 'string' } } });
    const { added } = diffFlatSchemas(flat, after);
    expect(added.map((f) => f.path)).toContain('email');
  });

  it('detects removed fields', () => {
    const minSchema = { type: 'object', required: ['id'], properties: { id: { type: 'string' } } };
    const after = flattenSchema(minSchema);
    const { removed } = diffFlatSchemas(flat, after);
    expect(removed.map((f) => f.path)).toContain('count');
  });
});
