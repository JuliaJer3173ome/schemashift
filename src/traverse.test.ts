import { traverseSchema, collectPaths, findNodeAtPath, traverseDiff } from './traverse';
import { JSONSchema, SchemaDiff } from './types';

const sampleSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: {
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
    },
  },
};

describe('traverseSchema', () => {
  it('visits the root node', () => {
    const visited: string[] = [];
    traverseSchema(sampleSchema, (_, path) => visited.push(path));
    expect(visited).toContain('#');
  });

  it('visits nested properties', () => {
    const visited: string[] = [];
    traverseSchema(sampleSchema, (_, path) => visited.push(path));
    expect(visited).toContain('#/properties/name');
    expect(visited).toContain('#/properties/address/properties/city');
  });

  it('visits array items', () => {
    const schema: JSONSchema = { type: 'array', items: { type: 'number' } };
    const visited: string[] = [];
    traverseSchema(schema, (_, path) => visited.push(path));
    expect(visited).toContain('#/items');
  });

  it('visits allOf subschemas', () => {
    const schema: JSONSchema = { allOf: [{ type: 'string' }, { minLength: 1 }] };
    const visited: string[] = [];
    traverseSchema(schema, (_, path) => visited.push(path));
    expect(visited).toContain('#/allOf/0');
    expect(visited).toContain('#/allOf/1');
  });
});

describe('collectPaths', () => {
  it('returns all paths in a schema', () => {
    const paths = collectPaths(sampleSchema);
    expect(paths.length).toBeGreaterThan(1);
    expect(paths[0]).toBe('#');
  });
});

describe('findNodeAtPath', () => {
  it('finds a node by path', () => {
    const node = findNodeAtPath(sampleSchema, '#/properties/name');
    expect(node).toEqual({ type: 'string' });
  });

  it('returns undefined for missing path', () => {
    const node = findNodeAtPath(sampleSchema, '#/properties/missing');
    expect(node).toBeUndefined();
  });
});

describe('traverseDiff', () => {
  it('calls callback with depth', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: '#/properties/x', value: { type: 'string' } },
    ];
    const results: number[] = [];
    traverseDiff(diffs, (_, depth) => results.push(depth));
    expect(results[0]).toBeGreaterThan(0);
  });
});
