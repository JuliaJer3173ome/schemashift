import { SchemaDiff } from './types';

export interface RankedDiff {
  diff: SchemaDiff;
  score: number;
  reason: string;
}

export interface RankOptions {
  breakingWeight?: number;
  depthWeight?: number;
  typeWeight?: number;
}

const DEFAULT_WEIGHTS: Required<RankOptions> = {
  breakingWeight: 10,
  depthWeight: 2,
  typeWeight: 5,
};

export function rankDiff(diff: SchemaDiff, options: RankOptions = {}): RankedDiff {
  const weights = { ...DEFAULT_WEIGHTS, ...options };
  const reasons: string[] = [];
  let score = 0;

  const isBreaking =
    diff.type === 'removed' ||
    (diff.type === 'changed' &&
      (diff.path.endsWith('/type') || diff.path.endsWith('/required')));

  if (isBreaking) {
    score += weights.breakingWeight;
    reasons.push('breaking change');
  }

  const depth = diff.path.split('/').filter(Boolean).length;
  score += depth * weights.depthWeight;
  if (depth > 2) reasons.push(`deep path (depth ${depth})`);

  if (diff.type === 'changed') {
    score += weights.typeWeight;
    reasons.push('value modified');
  } else if (diff.type === 'added') {
    score += Math.floor(weights.typeWeight / 2);
    reasons.push('new field');
  } else if (diff.type === 'removed') {
    score += weights.typeWeight;
    reasons.push('field removed');
  }

  return { diff, score, reason: reasons.join(', ') || 'minor change' };
}

export function rankDiffs(diffs: SchemaDiff[], options: RankOptions = {}): RankedDiff[] {
  return diffs
    .map((d) => rankDiff(d, options))
    .sort((a, b) => b.score - a.score);
}

export function formatRanked(ranked: RankedDiff[]): string {
  if (ranked.length === 0) return 'No changes to rank.';
  return ranked
    .map((r, i) => `#${i + 1} [score: ${r.score}] ${r.diff.path} (${r.diff.type}) — ${r.reason}`)
    .join('\n');
}
