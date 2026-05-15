import { SchemaDiff } from './types';
import { CompareResult } from './compare';

export interface CompatibilityScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

const BREAKING_PENALTY = 20;
const REMOVED_PENALTY = 10;
const MODIFIED_PENALTY = 5;
const ADDED_BONUS = 2;

export function scoreCompatibility(result: CompareResult): CompatibilityScore {
  if (result.areEqual) {
    return { score: 100, grade: 'A', summary: 'Schemas are identical.' };
  }

  let score = 100;
  score -= result.breakingCount * BREAKING_PENALTY;
  score -= result.removedCount * REMOVED_PENALTY;
  score -= result.modifiedCount * MODIFIED_PENALTY;
  score += Math.min(result.addedCount * ADDED_BONUS, 10);
  score = Math.max(0, Math.min(100, score));

  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  const parts: string[] = [];
  if (result.breakingCount > 0) parts.push(`${result.breakingCount} breaking change(s)`);
  if (result.removedCount > 0) parts.push(`${result.removedCount} removal(s)`);
  if (result.modifiedCount > 0) parts.push(`${result.modifiedCount} modification(s)`);
  if (result.addedCount > 0) parts.push(`${result.addedCount} addition(s)`);

  const summary = parts.length > 0 ? `Found: ${parts.join(', ')}.` : 'Minor differences detected.';

  return { score, grade, summary };
}

export function formatScore(score: CompatibilityScore): string {
  return `Compatibility Score: ${score.score}/100 (Grade: ${score.grade})\n${score.summary}`;
}
