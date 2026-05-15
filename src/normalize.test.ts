import { normalizeSchema, schemasAreEquivalent } from './normalize';

describe('normalizeSchema', () => {
  it('infers object type from properties', () => {
    const result = normalizeSchema({ properties: { name: { type: 'string' } } });
    expect(result.type).toBe('object');
  });

  it('infers array type from items', () => {
    const result = normalizeSchema({ items: { type: 'number' } });
    expect(result.type).toBe('array');
  });

  it('normalizes properties recursively', () => {
    const result = normalizeSchema({
      type: 'object',
      properties: {
        tags: { items: { type: 'string' } },
      },
    });
    expect(result.properties?.tags.type).toBe('array');
  });

  it('deduplicates required fields', () => {
    const result = normalizeSchema({
      type: 'object',
      required: ['a', 'b', 'a'],
      properties: {},
    });
    expect(result.required).toEqual(['a', 'b']);
  });

  it('adds default empty properties for object type', () => {
    const result = normalizeSchema({ type: 'object' });
    expect(result.properties).toEqual({});
  });

  it('sets additionalProperties to true by default for objects', () => {
    const result = normalizeSchema({ type: 'object' });
    expect(result.additionalProperties).toBe(true);
  });

  it('preserves explicit additionalProperties: false', () => {
    const result = normalizeSchema({ type: 'object', additionalProperties: false });
    expect(result.additionalProperties).toBe(false);
  });

  it('normalizes items recursively', () => {
    const result = normalizeSchema({
      type: 'array',
      items: { properties: { id: { type: 'integer' } } },
    });
    expect((result.items as any).type).toBe('object');
  });

  it('returns schema unchanged if no normalization needed', () => {
    const schema = { type: 'string', minLength: 1 };
    expect(normalizeSchema(schema)).toEqual(schema);
  });
});

describe('schemasAreEquivalent', () => {
  it('returns true for semantically identical schemas', () => {
    const a = { properties: { x: { type: 'string' } } };
    const b = { type: 'object', properties: { x: { type: 'string' } }, additionalProperties: true };
    expect(schemasAreEquivalent(a, b)).toBe(true);
  });

  it('returns false for different schemas', () => {
    const a = { type: 'string' };
    const b = { type: 'number' };
    expect(schemasAreEquivalent(a, b)).toBe(false);
  });

  it('is order-independent for properties', () => {
    const a = { type: 'object', properties: { a: { type: 'string' }, b: { type: 'number' } } };
    const b = { type: 'object', properties: { b: { type: 'number' }, a: { type: 'string' } } };
    expect(schemasAreEquivalent(a, b)).toBe(true);
  });
});
