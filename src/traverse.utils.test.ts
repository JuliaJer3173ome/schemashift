import {
  countNodes,
  getSchemaDepth,
  findNodesByType,
  hasNestedRefs,
  collectRequiredFields,
} from './traverse.utils';
import { JSONSchema } from './types';

const schema: JSONSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

describe('countNodes', () => {
  it('counts all schema nodes', () => {
    const count = countNodes(schema);
    expect(count).toBeGreaterThanOrEqual(5);
  });

  it('counts 1 for a simple schema', () => {
    expect(countNodes({ type: 'string' })).toBe(1);
  });
});

describe('getSchemaDepth', () => {
  it('returns depth greater than 1 for nested schema', () => {
    expect(getSchemaDepth(schema)).toBeGreaterThan(1);
  });

  it('returns 0 for flat schema', () => {
    expect(getSchemaDepth({ type: 'string' })).toBe(0);
  });
});

describe('findNodesByType', () => {
  it('finds all string-typed nodes', () => {
    const paths = findNodesByType(schema, 'string');
    expect(paths).toContain('#/properties/name');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty array when no match', () => {
    expect(findNodesByType(schema, 'boolean')).toEqual([]);
  });
});

describe('hasNestedRefs', () => {
  it('returns false when no $ref present', () => {
    expect(hasNestedRefs(schema)).toBe(false);
  });

  it('returns true when $ref is nested', () => {
    const withRef: JSONSchema = {
      type: 'object',
      properties: { child: { $ref: '#/definitions/foo' } },
    };
    expect(hasNestedRefs(withRef)).toBe(true);
  });
});

describe('collectRequiredFields', () => {
  it('collects required arrays by path', () => {
    const result = collectRequiredFields(schema);
    expect(result['#']).toEqual(['name']);
  });

  it('returns empty object when no required', () => {
    expect(collectRequiredFields({ type: 'string' })).toEqual({});
  });
});
