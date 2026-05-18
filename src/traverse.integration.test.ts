import { traverseSchema, collectPaths, findNodeAtPath } from './traverse';
import { countNodes, getSchemaDepth, collectRequiredFields } from './traverse.utils';
import { JSONSchema } from './types';

const complexSchema: JSONSchema = {
  type: 'object',
  required: ['user'],
  properties: {
    user: {
      type: 'object',
      required: ['id', 'email'],
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        roles: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['admin', 'viewer'],
          },
        },
      },
    },
  },
};

describe('traverse integration', () => {
  it('traverses and counts all nodes in complex schema', () => {
    const count = countNodes(complexSchema);
    expect(count).toBeGreaterThanOrEqual(7);
  });

  it('collectPaths and findNodeAtPath are consistent', () => {
    const paths = collectPaths(complexSchema);
    for (const path of paths) {
      const node = findNodeAtPath(complexSchema, path);
      expect(node).toBeDefined();
    }
  });

  it('depth reflects nesting level', () => {
    const depth = getSchemaDepth(complexSchema);
    expect(depth).toBeGreaterThanOrEqual(4);
  });

  it('collects required fields at multiple levels', () => {
    const required = collectRequiredFields(complexSchema);
    expect(required['#']).toContain('user');
    expect(required['#/properties/user']).toContain('id');
    expect(required['#/properties/user']).toContain('email');
  });

  it('visits all nodes via traverseSchema callback', () => {
    const types: string[] = [];
    traverseSchema(complexSchema, (node) => {
      if (node.type) types.push(node.type as string);
    });
    expect(types).toContain('object');
    expect(types).toContain('string');
    expect(types).toContain('array');
  });
});
