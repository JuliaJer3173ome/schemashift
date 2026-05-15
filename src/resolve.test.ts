import { parseRef, lookupRef, resolveRefs, resolveSchema } from './resolve';
import { JSONSchema } from './types';

describe('parseRef', () => {
  it('parses a simple local ref', () => {
    expect(parseRef('#/definitions/Foo')).toEqual(['definitions', 'Foo']);
  });

  it('decodes JSON Pointer escapes', () => {
    expect(parseRef('#/definitions/Foo~1Bar')).toEqual(['definitions', 'Foo/Bar']);
    expect(parseRef('#/definitions/Foo~0Bar')).toEqual(['definitions', 'Foo~Bar']);
  });

  it('throws on non-local refs', () => {
    expect(() => parseRef('http://example.com/schema')).toThrow('Unsupported $ref format');
  });
});

describe('lookupRef', () => {
  const root: JSONSchema = {
    definitions: { Address: { type: 'object', properties: { city: { type: 'string' } } } },
  };

  it('resolves a known path', () => {
    expect(lookupRef(root, ['definitions', 'Address'])).toEqual(root.definitions!['Address']);
  });

  it('throws for unknown path', () => {
    expect(() => lookupRef(root, ['definitions', 'Missing'])).toThrow('Could not resolve ref path');
  });
});

describe('resolveRefs', () => {
  const root: JSONSchema = {
    definitions: {
      Name: { type: 'string' },
    },
    type: 'object',
    properties: {
      name: { $ref: '#/definitions/Name' },
    },
  };

  it('replaces a $ref with the resolved schema', () => {
    const result = resolveRefs(root, root);
    expect((result as any).properties.name).toEqual({ type: 'string' });
  });

  it('returns primitives unchanged', () => {
    expect(resolveRefs('string' as any, root)).toBe('string');
  });

  it('throws when maxDepth exceeded in strict mode', () => {
    const circular: JSONSchema = { $ref: '#/definitions/Self' };
    const circRoot: JSONSchema = { definitions: { Self: { $ref: '#/definitions/Self' } } };
    expect(() => resolveRefs(circular, circRoot, { maxDepth: 2, strict: true })).toThrow('Max resolution depth');
  });
});

describe('resolveSchema', () => {
  const schema: JSONSchema = {
    type: 'object',
    definitions: {
      Tag: { type: 'string', enum: ['a', 'b'] },
    },
    properties: {
      tag: { $ref: '#/definitions/Tag' },
      label: { type: 'string' },
    },
  };

  it('returns a fully resolved schema', () => {
    const { schema: resolved } = resolveSchema(schema);
    expect((resolved as any).properties.tag).toEqual({ type: 'string', enum: ['a', 'b'] });
    expect((resolved as any).properties.label).toEqual({ type: 'string' });
  });

  it('collects refs metadata', () => {
    const { refs } = resolveSchema(schema);
    expect(refs['#/definitions/Tag']).toBeDefined();
  });

  it('reports depth > 0 when definitions exist', () => {
    const { depth } = resolveSchema(schema);
    expect(depth).toBe(1);
  });

  it('reports depth 0 for schema without definitions', () => {
    const plain: JSONSchema = { type: 'string' };
    const { depth } = resolveSchema(plain);
    expect(depth).toBe(0);
  });
});
