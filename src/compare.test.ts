import { compareSchemas, schemasAreCompatible } from './compare';

const baseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string', description: 'User name' },
  },
  required: ['id'],
};

describe('compareSchemas', () => {
  it('returns areEqual true for identical schemas', () => {
    const result = compareSchemas(baseSchema, baseSchema);
    expect(result.areEqual).toBe(true);
    expect(result.diff).toHaveLength(0);
  });

  it('detects added properties', () => {
    const target = {
      ...baseSchema,
      properties: { ...baseSchema.properties, email: { type: 'string' } },
    };
    const result = compareSchemas(baseSchema, target);
    expect(result.areEqual).toBe(false);
    expect(result.addedCount).toBeGreaterThan(0);
  });

  it('detects removed properties', () => {
    const target = { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] };
    const result = compareSchemas(baseSchema, target);
    expect(result.removedCount).toBeGreaterThan(0);
  });

  it('ignores description changes when option set', () => {
    const target = {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        name: { type: 'string', description: 'Full name' },
      },
    };
    const result = compareSchemas(baseSchema, target, { ignoreDescriptions: true });
    expect(result.areEqual).toBe(true);
  });

  it('counts breaking changes correctly', () => {
    const target = {
      type: 'object',
      properties: { id: { type: 'integer' } },
      required: ['id'],
    };
    const result = compareSchemas(baseSchema, target);
    expect(result.breakingCount).toBeGreaterThan(0);
  });
});

describe('schemasAreCompatible', () => {
  it('returns true when no breaking changes', () => {
    const target = {
      ...baseSchema,
      properties: { ...baseSchema.properties, email: { type: 'string' } },
    };
    expect(schemasAreCompatible(baseSchema, target)).toBe(true);
  });

  it('returns false when breaking changes exist', () => {
    const target = { type: 'string' };
    expect(schemasAreCompatible(baseSchema, target)).toBe(false);
  });
});
