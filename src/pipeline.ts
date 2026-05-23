import { SchemaDiff } from './types';

export type PipelineStep<T> = (input: T) => T;

export interface Pipeline<T> {
  steps: Array<{ name: string; fn: PipelineStep<T> }>;
}

export function createPipeline<T>(): Pipeline<T> {
  return { steps: [] };
}

export function addStep<T>(
  pipeline: Pipeline<T>,
  name: string,
  fn: PipelineStep<T>
): Pipeline<T> {
  return {
    steps: [...pipeline.steps, { name, fn }],
  };
}

export function runPipeline<T>(pipeline: Pipeline<T>, input: T): T {
  return pipeline.steps.reduce((acc, step) => step.fn(acc), input);
}

export function runPipelineWithTrace<T>(
  pipeline: Pipeline<T>,
  input: T
): { result: T; trace: Array<{ step: string; output: T }> } {
  const trace: Array<{ step: string; output: T }> = [];
  const result = pipeline.steps.reduce((acc, step) => {
    const output = step.fn(acc);
    trace.push({ step: step.name, output });
    return output;
  }, input);
  return { result, trace };
}

export function createDiffPipeline(
  steps: Array<{ name: string; fn: PipelineStep<SchemaDiff[]> }>
): Pipeline<SchemaDiff[]> {
  return { steps };
}

export function pipelineFromSteps<T>(
  ...entries: Array<[string, PipelineStep<T>]>
): Pipeline<T> {
  return {
    steps: entries.map(([name, fn]) => ({ name, fn })),
  };
}
