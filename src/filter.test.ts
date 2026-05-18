import { applyFilters, filterByType, filterByPath, filterByBreaking, filterBySearch, groupByPath } from './filter';
import { SchemaDiff } from './types';

const diffs: SchemaDiff[] = [
  { path: 'name', type: 'type-change', from: 'string', to: 'number' },
  { path: 'age', type: 'property-added', from: undefined, to: 'integer' },
  { path: 'email', type: 'property-removed', from: 'string', to: undefined },
  { path: 'address.street', type: 'property-added', from: undefined, to: 'string' },
  { path: 'address.city', type: 'required-added', from: undefined, to: 'string' },
];

describe('filterByType', () => {
  it('returns only diffs matching given types', () => {
    const result = filterByType(diffs, ['property-added']);
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.type === 'property-added')).toBe(true);
  });

  it('returns empty array when no types match', () => {
    const result = filterByType(diffs, ['description-changed']);
    expect(result).toHaveLength(0);
  });
});

describe('filterByPath', () => {
  it('returns diffs matching exact or nested paths', () => {
    const result = filterByPath(diffs, ['address']);
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.path.startsWith('address'))).toBe(true);
  });

  it('matches exact path', () => {
    const result = filterByPath(diffs, ['name']);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('name');
  });
});

describe('filterByBreaking', () => {
  it('returns only breaking changes when breaking=true', () => {
    const result = filterByBreaking(diffs, true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((d) => {
      expect(['type-change', 'property-removed', 'required-added']).toContain(d.type);
    });
  });

  it('returns only non-breaking when breaking=false', () => {
    const result = filterByBreaking(diffs, false);
    result.forEach((d) => {
      expect(['type-change', 'property-removed', 'required-added']).not.toContain(d.type);
    });
  });
});

describe('filterBySearch', () => {
  it('filters by path substring', () => {
    const result = filterBySearch(diffs, 'address');
    expect(result).toHaveLength(2);
  });

  it('filters by from/to value', () => {
    const result = filterBySearch(diffs, 'string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('applyFilters', () => {
  it('applies multiple filters together', () => {
    const result = applyFilters(diffs, { types: ['property-added'], paths: ['address'] });
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('address.street');
  });

  it('returns all diffs when no options given', () => {
    const result = applyFilters(diffs, {});
    expect(result).toHaveLength(diffs.length);
  });
});

describe('groupByPath', () => {
  it('groups diffs by their path', () => {
    const grouped = groupByPath(diffs);
    expect(grouped['name']).toHaveLength(1);
    expect(grouped['address.street']).toHaveLength(1);
  });
});
