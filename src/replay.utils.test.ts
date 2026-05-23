import { describe, it, expect } from 'vitest';
import {
  filterReplayByPath,
  findBreakingSteps,
  replayTypeSummary,
  sliceReplay,
  splitIntoEpochs,
} from './replay.utils';
import { ReplayStep } from './replay';
import { SchemaDiff } from './types';

const makeStep = (index: number, type: string, path: string): ReplayStep => ({
  index,
  diff: { type, path, before: undefined, after: {} } as SchemaDiff,
  schema: {},
});

const steps: ReplayStep[] = [
  makeStep(0, 'added', '/properties/age'),
  makeStep(1, 'removed', '/properties/name'),
  makeStep(2, 'added', '/required'),
];

describe('filterReplayByPath', () => {
  it('returns only steps matching path prefix', () => {
    const filtered = filterReplayByPath(steps, '/properties');
    expect(filtered).toHaveLength(2);
  });
});

describe('findBreakingSteps', () => {
  it('identifies removed and type-changed as breaking', () => {
    const breaking = findBreakingSteps(steps);
    expect(breaking).toEqual([1]);
  });
});

describe('replayTypeSummary', () => {
  it('counts each diff type', () => {
    const summary = replayTypeSummary(steps);
    expect(summary['added']).toBe(2);
    expect(summary['removed']).toBe(1);
  });
});

describe('sliceReplay', () => {
  it('returns steps within inclusive range', () => {
    const sliced = sliceReplay(steps, 1, 2);
    expect(sliced).toHaveLength(2);
    expect(sliced[0].index).toBe(1);
  });
});

describe('splitIntoEpochs', () => {
  it('splits diffs at breaking boundaries', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: '/a', before: undefined, after: {} },
      { type: 'removed', path: '/b', before: {}, after: undefined },
      { type: 'added', path: '/c', before: undefined, after: {} },
    ];
    const epochs = splitIntoEpochs(diffs);
    expect(epochs).toHaveLength(2);
    expect(epochs[0]).toHaveLength(2);
    expect(epochs[1]).toHaveLength(1);
  });

  it('returns single epoch when no breaking changes', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: '/a', before: undefined, after: {} },
    ];
    expect(splitIntoEpochs(diffs)).toHaveLength(1);
  });
});
