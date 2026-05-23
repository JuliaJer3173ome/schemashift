import { SchemaDiff } from './types';
import { applyDiff } from './patch';
import { JSONSchema } from './types';

export interface ReplayStep {
  index: number;
  diff: SchemaDiff;
  schema: JSONSchema;
}

export interface ReplayResult {
  steps: ReplayStep[];
  final: JSONSchema;
  totalSteps: number;
}

export interface ReplayOptions {
  stopAt?: number;
  onStep?: (step: ReplayStep) => void;
}

/**
 * Replay a sequence of diffs against a base schema, producing
 * the schema at each intermediate step.
 */
export function replayDiffs(
  base: JSONSchema,
  diffs: SchemaDiff[],
  options: ReplayOptions = {}
): ReplayResult {
  const { stopAt, onStep } = options;
  const steps: ReplayStep[] = [];
  let current: JSONSchema = structuredClone(base);

  const limit = stopAt !== undefined ? Math.min(stopAt, diffs.length) : diffs.length;

  for (let i = 0; i < limit; i++) {
    const diff = diffs[i];
    current = applyDiff(current, [diff]);
    const step: ReplayStep = { index: i, diff, schema: structuredClone(current) };
    steps.push(step);
    onStep?.(step);
  }

  return { steps, final: current, totalSteps: steps.length };
}

/**
 * Replay diffs up to a specific step index (0-based) and return
 * the resulting schema at that point.
 */
export function replayToStep(
  base: JSONSchema,
  diffs: SchemaDiff[],
  stepIndex: number
): JSONSchema {
  const result = replayDiffs(base, diffs, { stopAt: stepIndex + 1 });
  return result.final;
}

/**
 * Format a replay result as a human-readable summary.
 */
export function formatReplay(result: ReplayResult): string {
  const lines: string[] = [`Replay: ${result.totalSteps} step(s) applied`];
  for (const step of result.steps) {
    const { diff } = step;
    lines.push(`  [${step.index + 1}] ${diff.type.toUpperCase()} @ ${diff.path}`);
  }
  return lines.join('\n');
}
