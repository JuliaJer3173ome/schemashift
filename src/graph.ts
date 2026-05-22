import { JSONSchema, SchemaDiff } from './types';
import { collectPaths } from './traverse';

export interface SchemaNode {
  path: string;
  type: string | string[];
  required: boolean;
  depth: number;
}

export interface SchemaEdge {
  from: string;
  to: string;
  relation: 'parent' | 'property' | 'item';
}

export interface SchemaGraph {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

export function buildGraph(schema: JSONSchema, basePath = '#'): SchemaGraph {
  const nodes: SchemaNode[] = [];
  const edges: SchemaEdge[] = [];
  const requiredFields = new Set<string>(Array.isArray(schema.required) ? schema.required : []);

  function walk(node: JSONSchema, path: string, depth: number, parentPath: string | null) {
    const type = (node.type as string | string[]) ?? 'any';
    nodes.push({ path, type, required: requiredFields.has(path.split('/').pop() ?? ''), depth });

    if (parentPath !== null) {
      const relation: SchemaEdge['relation'] = path.includes('/properties/') ? 'property' : 'item';
      edges.push({ from: parentPath, to: path, relation });
    }

    if (node.properties) {
      for (const [key, child] of Object.entries(node.properties)) {
        walk(child as JSONSchema, `${path}/properties/${key}`, depth + 1, path);
      }
    }

    if (node.items && typeof node.items === 'object' && !Array.isArray(node.items)) {
      walk(node.items as JSONSchema, `${path}/items`, depth + 1, path);
    }
  }

  walk(schema, basePath, 0, null);
  return { nodes, edges };
}

export function graphFromDiff(before: JSONSchema, after: JSONSchema): { before: SchemaGraph; after: SchemaGraph } {
  return {
    before: buildGraph(before),
    after: buildGraph(after),
  };
}

export function formatGraph(graph: SchemaGraph): string {
  const lines: string[] = ['Nodes:'];
  for (const node of graph.nodes) {
    const typeStr = Array.isArray(node.type) ? node.type.join('|') : node.type;
    lines.push(`  ${node.path} [${typeStr}]${node.required ? ' (required)' : ''}`);
  }
  lines.push('Edges:');
  for (const edge of graph.edges) {
    lines.push(`  ${edge.from} --${edge.relation}--> ${edge.to}`);
  }
  return lines.join('\n');
}
