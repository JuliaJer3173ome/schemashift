import { diffSchemas } from './diff';
import { applyFilters, groupByPath } from './filter';

const schemaA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    age: { type: 'integer' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
      },
    },
  },
  required: ['id', 'name'],
};

const schemaB = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' },
        zip: { type: 'string' },
      },
    },
  },
  required: ['id', 'name', 'email'],
};

describe('filter integration', () => {
  let diffs: ReturnType<typeof diffSchemas>;

  beforeAll(() => {
    diffs = diffSchemas(schemaA, schemaB);
  });

  it('produces diffs that can be filtered by breaking changes', () => {
    const breaking = applyFilters(diffs, { breaking: true });
    expect(breaking.length).toBeGreaterThan(0);
    breaking.forEach((d) => {
      expect(['type-change', 'property-removed', 'required-added']).toContain(d.type);
    });
  });

  it('filters down to address-related changes', () => {
    const addressDiffs = applyFilters(diffs, { paths: ['address'] });
    addressDiffs.forEach((d) => {
      expect(d.path).toMatch(/^address/);
    });
  });

  it('can filter by search term and group results', () => {
    const searched = applyFilters(diffs, { search: 'email' });
    expect(searched.length).toBeGreaterThan(0);
    const grouped = groupByPath(searched);
    expect(Object.keys(grouped)).toContain('email');
  });

  it('combined filter narrows results correctly', () => {
    const result = applyFilters(diffs, {
      breaking: false,
      types: ['property-added'],
    });
    result.forEach((d) => {
      expect(d.type).toBe('property-added');
    });
  });
});
