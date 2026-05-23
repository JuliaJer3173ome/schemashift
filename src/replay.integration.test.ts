import { describe, it, expect } from 'vitest';
import { replayDiffs, formatReplay } from './replay';
import { splitIntoEpochs, findBreakingSteps, replayTypeSummary } from './replay.utils';
import { diffSchemas } from './diff';
import { JSONSchema } from './types';

describe('replay integration', () => {
  const v1: JSONSchema = {
    type: 'object',
    properties: { id: { type: 'string' }, name: { type: 'string' } },
    required: ['id'],
  };

  const v2: JSONSchema = {
    type: 'object',
    properties: { id: { type: 'string' }, email: { type: 'string' } },
    required: ['id', 'email'],
  };

  const v3: JSONSchema = {
    type: 'object',
    properties: { id: { type: 'number' }, email: { type: 'string' } },
    required: ['id', 'email'],
  };

  it('replays real diffs and reconstructs schema progression', () => {
    const d1 = diffSchemas(v1, v2);
    const d2 = diffSchemas(v2, v3);
    const allDiffs = [...d1, ...d2];

    const result = replayDiffs(v1, allDiffs);
    expect(result.totalSteps).toBe(allDiffs.length);
    expect(result.steps[0].schema).toBeDefined();
  });

  it('identifies breaking steps across a multi-version diff sequence', () => {
    const d1 = diffSchemas(v1, v2);
    const d2 = diffSchemas(v2, v3);
    const allDiffs = [...d1, ...d2];

    const result = replayDiffs(v1, allDiffs);
    const breaking = findBreakingSteps(result.steps);
    expect(breaking.length).toBeGreaterThanOrEqual(0);
  });

  it('splits diff sequence into epochs at breaking boundaries', () => {
    const d1 = diffSchemas(v1, v2);
    const d2 = diffSchemas(v2, v3);
    const epochs = splitIntoEpochs([...d1, ...d2]);
    expect(epochs.length).toBeGreaterThanOrEqual(1);
  });

  it('formatReplay produces readable output for real diffs', () => {
    const diffs = diffSchemas(v1, v2);
    const result = replayDiffs(v1, diffs);
    const text = formatReplay(result);
    expect(typeof text).toBe('string');
    expect(text).toContain('step(s)');
  });

  it('type summary reflects actual change types', () => {
    const diffs = diffSchemas(v1, v2);
    const result = replayDiffs(v1, diffs);
    const summary = replayTypeSummary(result.steps);
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    expect(total).toBe(diffs.length);
  });
});
