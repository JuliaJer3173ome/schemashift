import { buildGraph, graphFromDiff, formatGraph } from './graph';
import { JSONSchema } from './types';

const simpleSchema: JSONSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    age: { type: 'number' },
  },
};

const nestedSchema: JSONSchema = {
  type: 'object',
  properties: {
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
      },
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

describe('buildGraph', () => {
  it('creates a node for the root schema', () => {
    const graph = buildGraph(simpleSchema);
    expect(graph.nodes.some(n => n.path === '#')).toBe(true);
  });

  it('creates nodes for each property', () => {
    const graph = buildGraph(simpleSchema);
    const paths = graph.nodes.map(n => n.path);
    expect(paths).toContain('#/properties/id');
    expect(paths).toContain('#/properties/name');
    expect(paths).toContain('#/properties/age');
  });

  it('marks required fields correctly', () => {
    const graph = buildGraph(simpleSchema);
    const idNode = graph.nodes.find(n => n.path === '#/properties/id');
    const ageNode = graph.nodes.find(n => n.path === '#/properties/age');
    expect(idNode?.required).toBe(true);
    expect(ageNode?.required).toBe(false);
  });

  it('creates edges between parent and child nodes', () => {
    const graph = buildGraph(simpleSchema);
    const edge = graph.edges.find(e => e.from === '#' && e.to === '#/properties/id');
    expect(edge).toBeDefined();
    expect(edge?.relation).toBe('property');
  });

  it('handles nested schemas', () => {
    const graph = buildGraph(nestedSchema);
    const paths = graph.nodes.map(n => n.path);
    expect(paths).toContain('#/properties/address/properties/street');
  });

  it('handles array items', () => {
    const graph = buildGraph(nestedSchema);
    const itemNode = graph.nodes.find(n => n.path === '#/properties/tags/items');
    expect(itemNode).toBeDefined();
    const edge = graph.edges.find(e => e.to === '#/properties/tags/items');
    expect(edge?.relation).toBe('item');
  });

  it('assigns correct depth values', () => {
    const graph = buildGraph(nestedSchema);
    const root = graph.nodes.find(n => n.path === '#');
    const street = graph.nodes.find(n => n.path === '#/properties/address/properties/street');
    expect(root?.depth).toBe(0);
    expect(street?.depth).toBe(2);
  });
});

describe('graphFromDiff', () => {
  it('returns graphs for both schemas', () => {
    const result = graphFromDiff(simpleSchema, nestedSchema);
    expect(result.before.nodes.length).toBeGreaterThan(0);
    expect(result.after.nodes.length).toBeGreaterThan(0);
  });
});

describe('formatGraph', () => {
  it('returns a string with Nodes and Edges sections', () => {
    const graph = buildGraph(simpleSchema);
    const output = formatGraph(graph);
    expect(output).toContain('Nodes:');
    expect(output).toContain('Edges:');
    expect(output).toContain('#/properties/id');
  });

  it('shows required annotation', () => {
    const graph = buildGraph(simpleSchema);
    const output = formatGraph(graph);
    expect(output).toContain('(required)');
  });
});
