import { mergeSchemas } from './merge';
import { JSONSchema } from './types';

describe('mergeSchemas', () => {
  const schemaA: JSONSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
    },
    required: ['name'],
  };

  const schemaB: JSONSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
    },
    required: ['email'],
  };

  it('merges non-overlapping properties from both schemas', () => {
    const result = mergeSchemas(schemaA, schemaB);
    expect(result.schema.properties).toHaveProperty('name');
    expect(result.schema.properties).toHaveProperty('age');
    expect(result.schema.properties).toHaveProperty('email');
  });

  it('merges required arrays from both schemas', () => {
    const result = mergeSchemas(schemaA, schemaB);
    expect(result.schema.required).toContain('name');
    expect(result.schema.required).toContain('email');
  });

  it('returns no conflicts when schemas have no changed fields', () => {
    const result = mergeSchemas(schemaA, schemaB);
    expect(result.conflicts).toHaveLength(0);
    expect(result.merged).toBe(true);
  });

  it('detects conflicts when a field type changes', () => {
    const modified: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'number' },
      },
    };
    const result = mergeSchemas(schemaA, modified);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.merged).toBe(false);
  });

  it('prefers source when preferSource is true', () => {
    const modified: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'number' },
      },
    };
    const result = mergeSchemas(schemaA, modified, { preferSource: true });
    expect(result.schema.properties?.name.type).toBe('string');
  });

  it('prefers target by default on top-level conflicts', () => {
    const modified: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'number' },
      },
    };
    const result = mergeSchemas(schemaA, modified, { preferSource: false });
    expect(result.schema.properties?.name.type).toBe('number');
  });

  it('handles schemas with no properties gracefully', () => {
    const empty: JSONSchema = { type: 'object' };
    const result = mergeSchemas(empty, schemaA);
    expect(result.schema.properties).toHaveProperty('name');
  });
});
