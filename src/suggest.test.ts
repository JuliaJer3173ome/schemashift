import { describe, it, expect } from 'vitest';
import {
  suggestForDiff,
  generateSuggestions,
  formatSuggestions,
} from './suggest';
import { ChangeType } from './types';

const makeDiff = (type: ChangeType, path = 'root.field', oldValue?: unknown, newValue?: unknown) => ({
  path,
  type,
  oldValue,
  newValue,
});

describe('suggestForDiff', () => {
  it('returns error suggestion for removed property', () => {
    const result = suggestForDiff(makeDiff(ChangeType.Removed, 'user.email') as any);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('error');
    expect(result[0].path).toBe('user.email');
  });

  it('returns error suggestion for type change', () => {
    const result = suggestForDiff(makeDiff(ChangeType.TypeChanged, 'user.age', 'string', 'number') as any);
    expect(result[0].severity).toBe('error');
    expect(result[0].message).toContain('string');
    expect(result[0].message).toContain('number');
  });

  it('returns info suggestion for added property', () => {
    const result = suggestForDiff(makeDiff(ChangeType.Added, 'user.nickname') as any);
    expect(result[0].severity).toBe('info');
  });

  it('returns warning suggestion for modified property', () => {
    const result = suggestForDiff(makeDiff(ChangeType.Modified, 'user.age', 0, 18) as any);
    expect(result[0].severity).toBe('warning');
  });
});

describe('generateSuggestions', () => {
  it('aggregates suggestions from multiple diffs', () => {
    const diffs = [
      makeDiff(ChangeType.Removed, 'a'),
      makeDiff(ChangeType.Added, 'b'),
    ] as any[];
    const report = generateSuggestions(diffs);
    expect(report.total).toBe(2);
    expect(report.hasCritical).toBe(true);
  });

  it('returns hasCritical false when no errors', () => {
    const diffs = [makeDiff(ChangeType.Added, 'x')] as any[];
    const report = generateSuggestions(diffs);
    expect(report.hasCritical).toBe(false);
  });

  it('returns empty report for no diffs', () => {
    const report = generateSuggestions([]);
    expect(report.total).toBe(0);
    expect(report.suggestions).toHaveLength(0);
  });
});

describe('formatSuggestions', () => {
  it('returns no suggestions message when empty', () => {
    const report = { suggestions: [], total: 0, hasCritical: false };
    expect(formatSuggestions(report)).toBe('No suggestions.');
  });

  it('formats suggestions with icons and fix hints', () => {
    const report = generateSuggestions([makeDiff(ChangeType.Removed, 'user.id')] as any[]);
    const output = formatSuggestions(report);
    expect(output).toContain('✖');
    expect(output).toContain('user.id');
    expect(output).toContain('Fix:');
  });
});
