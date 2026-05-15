import {
  renameProperty,
  addDefaultValue,
  dropProperty,
  applyTransforms,
  TransformRule,
} from './transform';
import { JSONSchema, SchemaDiff } from './types';

const baseSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
  },
  required: ['name'],
};

describe('renameProperty', () => {
  it('renames an existing property', () => {
    const result = renameProperty(baseSchema, 'name', 'fullName');
    expect(result.properties).toHaveProperty('fullName');
    expect(result.properties).not.toHaveProperty('name');
  });

  it('updates required array when renaming', () => {
    const result = renameProperty(baseSchema, 'name', 'fullName');
    expect(result.required).toContain('fullName');
    expect(result.required).not.toContain('name');
  });

  it('returns schema unchanged if property does not exist', () => {
    const result = renameProperty(baseSchema, 'missing', 'other');
    expect(result).toEqual(baseSchema);
  });
});

describe('addDefaultValue', () => {
  it('adds a default to an existing property', () => {
    const result = addDefaultValue(baseSchema, 'age', 0);
    expect(result.properties?.age?.default).toBe(0);
  });

  it('does not modify schema if property is missing', () => {
    const result = addDefaultValue(baseSchema, 'unknown', 42);
    expect(result).toEqual(baseSchema);
  });
});

describe('dropProperty', () => {
  it('removes an existing property', () => {
    const result = dropProperty(baseSchema, 'age');
    expect(result.properties).not.toHaveProperty('age');
  });

  it('removes property from required if present', () => {
    const result = dropProperty(baseSchema, 'name');
    expect(result.required).not.toContain('name');
  });

  it('returns schema unchanged if property does not exist', () => {
    const result = dropProperty(baseSchema, 'ghost');
    expect(result.properties).toEqual(baseSchema.properties);
  });
});

describe('applyTransforms', () => {
  it('applies matching rules and tracks applied/skipped paths', () => {
    const diffs: SchemaDiff[] = [
      { path: '/properties/name', type: 'changed', before: 'string', after: 'text' },
      { path: '/properties/age', type: 'removed', before: 'integer', after: undefined },
    ];

    const rules: TransformRule[] = [
      {
        match: (d) => d.path === '/properties/name',
        apply: (s) => renameProperty(s, 'name', 'fullName'),
      },
    ];

    const result = applyTransforms(baseSchema, diffs, rules);
    expect(result.applied).toContain('/properties/name');
    expect(result.skipped).toContain('/properties/age');
    expect(result.schema.properties).toHaveProperty('fullName');
  });
});
