import { describe, it, expect, vi } from 'vitest';
import { replayDiffs, replayToStep, formatReplay } from './replay';
import { SchemaDiff, JSONSchema } from './types';

const base: JSONSchema = { type: 'object', properties: { name: { type: 'string' } } };

const diffs: SchemaDiff[] = [
  { type: 'added', path: '/properties/age', before: undefined, after: { type: 'number' } },
  { type: 'removed', path: '/properties/name', before: { type: 'string' }, after: undefined },
];

describe('replayDiffs', () => {
  it('applies all diffs in order', () => {
    const result = replayDiffs(base, diffs);
    expect(result.totalSteps).toBe(2);
    expect(result.final.properties).toHaveProperty('age');
    expect(result.final.properties).not.toHaveProperty('name');
  });

  it('respects stopAt option', () => {
    const result = replayDiffs(base, diffs, { stopAt: 1 });
    expect(result.totalSteps).toBe(1);
    expect(result.final.properties).toHaveProperty('age');
    expect(result.final.properties).toHaveProperty('name');
  });

  it('calls onStep callback for each step', () => {
    const cb = vi.fn();
    replayDiffs(base, diffs, { onStep: cb });
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb.mock.calls[0][0].index).toBe(0);
    expect(cb.mock.calls[1][0].index).toBe(1);
  });

  it('returns empty steps for empty diffs', () => {
    const result = replayDiffs(base, []);
    expect(result.steps).toHaveLength(0);
    expect(result.final).toEqual(base);
  });
});

describe('replayToStep', () => {
  it('returns schema at step 0', () => {
    const schema = replayToStep(base, diffs, 0);
    expect(schema.properties).toHaveProperty('age');
    expect(schema.properties).toHaveProperty('name');
  });

  it('returns schema at last step', () => {
    const schema = replayToStep(base, diffs, 1);
    expect(schema.properties).not.toHaveProperty('name');
  });
});

describe('formatReplay', () => {
  it('includes step count and diff info', () => {
    const result = replayDiffs(base, diffs);
    const text = formatReplay(result);
    expect(text).toContain('2 step(s)');
    expect(text).toContain('ADDED');
    expect(text).toContain('REMOVED');
  });
});
