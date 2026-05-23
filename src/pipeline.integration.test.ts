import { pipelineFromSteps, runPipeline, runPipelineWithTrace } from './pipeline';
import { SchemaDiff } from './types';
import { filterByBreaking } from './filter';
import { rankDiffs } from './rank';
import { dedupeDiffs } from './dedupe';

const makeDiff = (type: SchemaDiff['type'], path: string): SchemaDiff => ({
  type,
  path,
  before: type === 'removed' ? 'string' : undefined,
  after: type === 'added' ? 'string' : undefined,
});

describe('pipeline integration', () => {
  const rawDiffs: SchemaDiff[] = [
    makeDiff('removed', 'properties.name'),
    makeDiff('added', 'properties.email'),
    makeDiff('removed', 'properties.name'),
    makeDiff('added', 'properties.title'),
    makeDiff('modified', 'properties.age'),
  ];

  it('dedupes then filters breaking changes', () => {
    const p = pipelineFromSteps<SchemaDiff[]>(
      ['dedupe', (ds) => dedupeDiffs(ds)],
      ['breaking', (ds) => filterByBreaking(ds)]
    );
    const result = runPipeline(p, rawDiffs);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((d) => {
      expect(['removed', 'modified']).toContain(d.type);
    });
  });

  it('produces a trace with named steps', () => {
    const p = pipelineFromSteps<SchemaDiff[]>(
      ['dedupe', (ds) => dedupeDiffs(ds)],
      ['rank', (ds) => rankDiffs(ds)]
    );
    const { trace } = runPipelineWithTrace(p, rawDiffs);
    expect(trace.map((t) => t.step)).toEqual(['dedupe', 'rank']);
    trace.forEach((t) => {
      expect(Array.isArray(t.output)).toBe(true);
    });
  });

  it('empty pipeline preserves all diffs', () => {
    const p = pipelineFromSteps<SchemaDiff[]>();
    const result = runPipeline(p, rawDiffs);
    expect(result).toHaveLength(rawDiffs.length);
  });
});
