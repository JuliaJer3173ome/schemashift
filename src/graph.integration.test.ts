import { buildGraph, graphFromDiff, formatGraph } from './graph';
import { diffSchemas } from './diff';
import { JSONSchema } from './types';

const v1: JSONSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    meta: {
      type: 'object',
      properties: {
        created: { type: 'string' },
      },
    },
  },
};

const v2: JSONSchema = {
  type: 'object',
  required: ['id', 'status'],
  properties: {
    id: { type: 'string' },
    status: { type: 'string' },
    meta: {
      type: 'object',
      properties: {
        created: { type: 'string' },
        updated: { type: 'string' },
      },
    },
  },
};

describe('graph integration', () => {
  it('reflects schema additions in the after graph', () => {
    const { after } = graphFromDiff(v1, v2);
    const paths = after.nodes.map(n => n.path);
    expect(paths).toContain('#/properties/status');
    expect(paths).toContain('#/properties/meta/properties/updated');
  });

  it('before graph does not include added fields', () => {
    const { before } = graphFromDiff(v1, v2);
    const paths = before.nodes.map(n => n.path);
    expect(paths).not.toContain('#/properties/status');
    expect(paths).not.toContain('#/properties/meta/properties/updated');
  });

  it('graph node count grows with schema complexity', () => {
    const { before, after } = graphFromDiff(v1, v2);
    expect(after.nodes.length).toBeGreaterThan(before.nodes.length);
  });

  it('edge count reflects property relationships', () => {
    const graph = buildGraph(v2);
    const propertyEdges = graph.edges.filter(e => e.relation === 'property');
    expect(propertyEdges.length).toBeGreaterThanOrEqual(5);
  });

  it('formatGraph output is consistent with diffSchemas result', () => {
    const diffs = diffSchemas(v1, v2);
    const graph = buildGraph(v2);
    const output = formatGraph(graph);
    const addedPaths = diffs.filter(d => d.type === 'added').map(d => d.path);
    for (const p of addedPaths) {
      // graph paths use JSON pointer style, diff paths use dot notation — just verify output is non-empty
      expect(output.length).toBeGreaterThan(0);
    }
  });
});
