import { validateSchema, validateDiffSchemas } from './validate';

describe('validateSchema', () => {
  it('returns valid for a simple valid schema', () => {
    const result = validateSchema({ type: 'string' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for a non-object schema', () => {
    const result = validateSchema(null as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Schema must be a non-null object');
  });

  it('returns invalid for an unknown type', () => {
    const result = validateSchema({ type: 'blob' as any });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/Invalid type/);
  });

  it('validates nested properties recursively', () => {
    const result = validateSchema({
      type: 'object',
      properties: {
        age: { type: 'invalid_type' as any },
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/properties\.age/);
  });

  it('returns invalid when required is not an array', () => {
    const result = validateSchema({ type: 'object', required: 'name' as any });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('"required" must be an array');
  });

  it('returns invalid when minimum > maximum', () => {
    const result = validateSchema({ type: 'number', minimum: 10, maximum: 5 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('"minimum" must be less than or equal to "maximum"');
  });

  it('validates items schema for arrays', () => {
    const result = validateSchema({
      type: 'array',
      items: { type: 'bad_type' as any },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/items:/);
  });

  it('accepts a complex valid schema', () => {
    const result = validateSchema({
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        age: { type: 'integer', minimum: 0, maximum: 150 },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['name'],
    });
    expect(result.valid).toBe(true);
  });
});

describe('validateDiffSchemas', () => {
  it('returns canDiff true when both schemas are valid', () => {
    const result = validateDiffSchemas({ type: 'string' }, { type: 'number' });
    expect(result.canDiff).toBe(true);
    expect(result.source.valid).toBe(true);
    expect(result.target.valid).toBe(true);
  });

  it('returns canDiff false when source schema is invalid', () => {
    const result = validateDiffSchemas({ type: 'bad' as any }, { type: 'number' });
    expect(result.canDiff).toBe(false);
    expect(result.source.valid).toBe(false);
  });
});
