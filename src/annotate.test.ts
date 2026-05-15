import { annotateSchema, annotateDiff, formatAnnotations } from './annotate';
import { SchemaDiff } from './types';

describe('annotateSchema', () => {
  it('flags missing description', () => {
    const result = annotateSchema({ type: 'object' });
    expect(result.annotations.some(a => a.message.includes('missing a description'))).toBe(true);
  });

  it('flags object with no properties', () => {
    const result = annotateSchema({ type: 'object' });
    expect(result.annotations.some(a => a.message.includes('no properties defined'))).toBe(true);
  });

  it('flags properties missing description or type', () => {
    const result = annotateSchema({
      type: 'object',
      description: 'A test schema',
      properties: { name: {} },
    });
    const paths = result.annotations.map(a => a.path);
    expect(paths).toContain('#/properties/name');
  });

  it('flags unrestricted additionalProperties', () => {
    const result = annotateSchema({ type: 'object', description: 'x', properties: {} });
    expect(result.annotations.some(a => a.message.includes('additionalProperties'))).toBe(true);
  });

  it('returns no additionalProperties warning when restricted', () => {
    const result = annotateSchema({ type: 'object', description: 'x', properties: {}, additionalProperties: false });
    expect(result.annotations.some(a => a.message.includes('additionalProperties'))).toBe(false);
  });
});

describe('annotateDiff', () => {
  const diffs: SchemaDiff[] = [
    { path: '#/properties/age', type: 'removed', oldValue: { type: 'number' }, newValue: undefined },
    { path: '#/properties/name/type', type: 'changed', oldValue: 'string', newValue: 'number' },
    { path: '#/properties/email', type: 'added', oldValue: undefined, newValue: { type: 'string' } },
  ];

  it('marks removed fields as breaking', () => {
    const annotations = annotateDiff(diffs);
    expect(annotations[0].kind).toBe('breaking');
  });

  it('marks type changes as breaking', () => {
    const annotations = annotateDiff(diffs);
    expect(annotations[1].kind).toBe('breaking');
  });

  it('marks added fields as info', () => {
    const annotations = annotateDiff(diffs);
    expect(annotations[2].kind).toBe('info');
  });
});

describe('formatAnnotations', () => {
  it('returns placeholder when empty', () => {
    expect(formatAnnotations([])).toBe('No annotations.');
  });

  it('formats annotations with kind prefix', () => {
    const output = formatAnnotations([{ path: '#', kind: 'warning', message: 'test warning' }]);
    expect(output).toContain('[WARNING]');
    expect(output).toContain('test warning');
  });
});
