import { applyPatch, revertPatch } from './patch';
import { SchemaDiff } from './types';

describe('applyPatch', () => {
  const base = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
    },
    required: ['name'],
  };

  it('applies an added diff', () => {
    const diffs: SchemaDiff[] = [
      { path: '#/properties/email', type: 'added', from: undefined, to: { type: 'string' } },
    ];
    const { schema, applied, skipped } = applyPatch(base, diffs);
    expect((schema as any).properties.email).toEqual({ type: 'string' });
    expect(applied).toContain('#/properties/email');
    expect(skipped).toHaveLength(0);
  });

  it('applies a removed diff', () => {
    const diffs: SchemaDiff[] = [
      { path: '#/properties/age', type: 'removed', from: { type: 'integer' }, to: undefined },
    ];
    const { schema } = applyPatch(base, diffs);
    expect((schema as any).properties.age).toBeUndefined();
  });

  it('applies a changed diff', () => {
    const diffs: SchemaDiff[] = [
      { path: '#/properties/name/type', type: 'changed', from: 'string', to: 'number' },
    ];
    const { schema } = applyPatch(base, diffs);
    expect((schema as any).properties.name.type).toBe('number');
  });

  it('does not mutate the original schema', () => {
    const diffs: SchemaDiff[] = [
      { path: '#/properties/email', type: 'added', from: undefined, to: { type: 'string' } },
    ];
    applyPatch(base, diffs);
    expect((base as any).properties.email).toBeUndefined();
  });

  it('applies multiple diffs', () => {
    const diffs: SchemaDiff[] = [
      { path: '#/properties/email', type: 'added', from: undefined, to: { type: 'string' } },
      { path: '#/properties/age', type: 'removed', from: { type: 'integer' }, to: undefined },
    ];
    const { schema, applied } = applyPatch(base, diffs);
    expect((schema as any).properties.email).toBeDefined();
    expect((schema as any).properties.age).toBeUndefined();
    expect(applied).toHaveLength(2);
  });
});

describe('revertPatch', () => {
  it('reverts an applied patch', () => {
    const base = { type: 'object', properties: { name: { type: 'string' } } };
    const diffs: SchemaDiff[] = [
      { path: '#/properties/email', type: 'added', from: undefined, to: { type: 'string' } },
    ];
    const { schema: patched } = applyPatch(base, diffs);
    const { schema: reverted } = revertPatch(patched, diffs);
    expect((reverted as any).properties.email).toBeUndefined();
    expect((reverted as any).properties.name).toEqual({ type: 'string' });
  });
});
