import { scoreCompatibility, formatScore } from './score';
import { CompareResult } from './compare';

function makeResult(overrides: Partial<CompareResult>): CompareResult {
  return {
    areEqual: false,
    diff: [],
    addedCount: 0,
    removedCount: 0,
    modifiedCount: 0,
    breakingCount: 0,
    ...overrides,
  };
}

describe('scoreCompatibility', () => {
  it('returns 100 and grade A for equal schemas', () => {
    const result = makeResult({ areEqual: true });
    const score = scoreCompatibility(result);
    expect(score.score).toBe(100);
    expect(score.grade).toBe('A');
  });

  it('penalizes breaking changes heavily', () => {
    const result = makeResult({ breakingCount: 3 });
    const score = scoreCompatibility(result);
    expect(score.score).toBeLessThanOrEqual(40);
    expect(['D', 'F']).toContain(score.grade);
  });

  it('penalizes removals moderately', () => {
    const result = makeResult({ removedCount: 2 });
    const score = scoreCompatibility(result);
    expect(score.score).toBe(80);
    expect(score.grade).toBe('B');
  });

  it('gives small bonus for additions', () => {
    const result = makeResult({ addedCount: 3, modifiedCount: 1 });
    const score = scoreCompatibility(result);
    expect(score.score).toBe(101 > 100 ? 100 : 100 - 5 + 6);
  });

  it('does not exceed 100', () => {
    const result = makeResult({ addedCount: 100 });
    const score = scoreCompatibility(result);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it('does not go below 0', () => {
    const result = makeResult({ breakingCount: 10, removedCount: 10 });
    const score = scoreCompatibility(result);
    expect(score.score).toBeGreaterThanOrEqual(0);
  });
});

describe('formatScore', () => {
  it('formats the score as a readable string', () => {
    const score = { score: 85, grade: 'B' as const, summary: 'Found: 1 removal(s).' };
    const output = formatScore(score);
    expect(output).toContain('85/100');
    expect(output).toContain('Grade: B');
    expect(output).toContain('1 removal(s)');
  });
});
