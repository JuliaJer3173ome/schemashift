import { SchemaDiff } from './types';
import { ReplayStep } from './replay';

/**
 * Extract only the diffs that affected a specific path prefix.
 */
export function filterReplayByPath(steps: ReplayStep[], pathPrefix: string): ReplayStep[] {
  return steps.filter(s => s.diff.path.startsWith(pathPrefix));
}

/**
 * Return the step indices where a breaking change occurred.
 */
export function findBreakingSteps(steps: ReplayStep[]): number[] {
  const breakingTypes = new Set(['removed', 'type-changed']);
  return steps
    .filter(s => breakingTypes.has(s.diff.type))
    .map(s => s.index);
}

/**
 * Summarize which diff types appear across all replay steps.
 */
export function replayTypeSummary(steps: ReplayStep[]): Record<string, number> {
  return steps.reduce<Record<string, number>>((acc, s) => {
    acc[s.diff.type] = (acc[s.diff.type] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Slice replay steps into a sub-range (inclusive on both ends).
 */
export function sliceReplay(steps: ReplayStep[], from: number, to: number): ReplayStep[] {
  return steps.filter(s => s.index >= from && s.index <= to);
}

/**
 * Given an array of diffs, group them into "epochs" separated by
 * breaking changes so callers can replay epoch-by-epoch.
 */
export function splitIntoEpochs(diffs: SchemaDiff[]): SchemaDiff[][] {
  const breakingTypes = new Set(['removed', 'type-changed']);
  const epochs: SchemaDiff[][] = [];
  let current: SchemaDiff[] = [];

  for (const diff of diffs) {
    current.push(diff);
    if (breakingTypes.has(diff.type)) {
      epochs.push(current);
      current = [];
    }
  }

  if (current.length > 0) epochs.push(current);
  return epochs;
}
