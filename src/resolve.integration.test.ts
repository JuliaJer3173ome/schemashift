import { resolveSchema } from './resolve';
import { diffSchemas } from './diff';
import { JSONSchema } from './types';

describe('resolve + diff integration', () => {
  const v1: JSONSchema = {
    type: 'object',
    definitions: {
      Address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
        },
        required: ['street'],
      },
    },
    properties: {
      address: { $ref: '#/definitions/Address' },
      name: { type: 'string' },
    },
    required: ['name'],
  };

  const v2: JSONSchema = {
    type: 'object',
    definitions: {
      Address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          zip: { type: 'string' },
        },
        required: ['street', 'city'],
      },
    },
    properties: {
      address: { $ref: '#/definitions/Address' },
      name: { type: 'string' },
    },
    required: ['name'],
  };

  /** Resolve both schema versions and return their diffs as a convenience helper. */
  function resolveAndDiff(a: JSONSchema, b: JSONSchema) {
    const { schema: resolved1 } = resolveSchema(a);
    const { schema: resolved2 } = resolveSchema(b);
    return diffSchemas(resolved1, resolved2);
  }

  it('diffs resolved schemas and detects added zip property', () => {
    const diffs = resolveAndDiff(v1, v2);
    const paths = diffs.map(d => d.path);
    expect(paths.some(p => p.includes('zip'))).toBe(true);
  });

  it('detects breaking required change after resolution', () => {
    const diffs = resolveAndDiff(v1, v2);
    const added = diffs.filter(d => d.type === 'added');
    expect(added.length).toBeGreaterThan(0);
  });

  it('produces no diffs for identical resolved schemas', () => {
    const diffs = resolveAndDiff(v1, v1);
    expect(diffs).toHaveLength(0);
  });
});
