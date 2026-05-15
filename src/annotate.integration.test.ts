import { diffSchemas } from './diff';
import { annotateSchema, annotateDiff, formatAnnotations } from './annotate';

const schemaV1 = {
  type: 'object' as const,
  description: 'User schema',
  properties: {
    id: { type: 'string', description: 'Unique ID' },
    age: { type: 'number', description: 'User age' },
  },
  additionalProperties: false,
};

const schemaV2 = {
  type: 'object' as const,
  description: 'User schema v2',
  properties: {
    id: { type: 'string', description: 'Unique ID' },
    email: { type: 'string', description: 'Email address' },
  },
  additionalProperties: false,
};

describe('annotate integration', () => {
  it('produces schema annotations for a well-formed schema', () => {
    const { annotations } = annotateSchema(schemaV1);
    expect(annotations.every(a => a.kind !== 'breaking')).toBe(true);
  });

  it('produces diff annotations including breaking changes', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const annotations = annotateDiff(diffs);
    const breaking = annotations.filter(a => a.kind === 'breaking');
    expect(breaking.length).toBeGreaterThan(0);
  });

  it('formatAnnotations produces readable output from diff', () => {
    const diffs = diffSchemas(schemaV1, schemaV2);
    const annotations = annotateDiff(diffs);
    const output = formatAnnotations(annotations);
    expect(output).toContain('[BREAKING]');
    expect(output).toContain('[INFO]');
  });

  it('combined schema + diff annotations cover all concerns', () => {
    const schemaAnnotations = annotateSchema(schemaV1).annotations;
    const diffs = diffSchemas(schemaV1, schemaV2);
    const diffAnnotations = annotateDiff(diffs);
    const all = [...schemaAnnotations, ...diffAnnotations];
    expect(all.length).toBeGreaterThan(0);
  });
});
