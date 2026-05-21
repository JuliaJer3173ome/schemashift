import { describe, it, expect } from 'vitest';
import { diffSchemas } from './diff';
import { generateSuggestions, formatSuggestions } from './suggest';

describe('suggest integration', () => {
  it('produces error suggestions when a required field is removed', () => {
    const before = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['id', 'name'],
    };
    const after = {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    };
    const diffs = diffSchemas(before, after);
    const report = generateSuggestions(diffs);
    expect(report.hasCritical).toBe(true);
    expect(report.suggestions.some((s) => s.path.includes('name'))).toBe(true);
  });

  it('produces info suggestions when a new optional field is added', () => {
    const before = {
      type: 'object',
      properties: { id: { type: 'string' } },
    };
    const after = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nickname: { type: 'string' },
      },
    };
    const diffs = diffSchemas(before, after);
    const report = generateSuggestions(diffs);
    expect(report.hasCritical).toBe(false);
    expect(report.suggestions.some((s) => s.severity === 'info')).toBe(true);
  });

  it('formats a full suggestion report as readable text', () => {
    const before = { type: 'object', properties: { age: { type: 'string' } } };
    const after = { type: 'object', properties: { age: { type: 'number' } } };
    const diffs = diffSchemas(before, after);
    const report = generateSuggestions(diffs);
    const text = formatSuggestions(report);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});
