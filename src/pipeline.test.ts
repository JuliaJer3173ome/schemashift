import {
  createPipeline,
  addStep,
  runPipeline,
  runPipelineWithTrace,
  createDiffPipeline,
  pipelineFromSteps,
} from './pipeline';
import { SchemaDiff } from './types';

const mockDiff = (type: string, path: string): SchemaDiff => ({
  type: type as SchemaDiff['type'],
  path,
  before: undefined,
  after: undefined,
});

describe('createPipeline', () => {
  it('creates an empty pipeline', () => {
    const p = createPipeline<number[]>();
    expect(p.steps).toHaveLength(0);
  });
});

describe('addStep', () => {
  it('adds a step immutably', () => {
    const p = createPipeline<number[]>();
    const p2 = addStep(p, 'double', (xs) => xs.map((x) => x * 2));
    expect(p.steps).toHaveLength(0);
    expect(p2.steps).toHaveLength(1);
    expect(p2.steps[0].name).toBe('double');
  });
});

describe('runPipeline', () => {
  it('applies steps in order', () => {
    const p = pipelineFromSteps<number>(
      ['add1', (x) => x + 1],
      ['double', (x) => x * 2]
    );
    expect(runPipeline(p, 3)).toBe(8);
  });

  it('returns input unchanged for empty pipeline', () => {
    const p = createPipeline<string>();
    expect(runPipeline(p, 'hello')).toBe('hello');
  });
});

describe('runPipelineWithTrace', () => {
  it('records each step output', () => {
    const p = pipelineFromSteps<number>(
      ['inc', (x) => x + 1],
      ['square', (x) => x * x]
    );
    const { result, trace } = runPipelineWithTrace(p, 2);
    expect(result).toBe(9);
    expect(trace).toHaveLength(2);
    expect(trace[0]).toEqual({ step: 'inc', output: 3 });
    expect(trace[1]).toEqual({ step: 'square', output: 9 });
  });
});

describe('createDiffPipeline', () => {
  it('runs diff transformation steps', () => {
    const diffs: SchemaDiff[] = [
      mockDiff('added', 'a'),
      mockDiff('removed', 'b'),
      mockDiff('added', 'c'),
    ];
    const p = createDiffPipeline([
      { name: 'onlyAdded', fn: (ds) => ds.filter((d) => d.type === 'added') },
    ]);
    const result = runPipeline(p, diffs);
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.type === 'added')).toBe(true);
  });
});
