import { describe, it, expect } from 'vitest';
import { formatAsText, formatAsMarkdown, formatAsJson, formatOutput } from './format';
import { SchemaDiff } from './types';

const sampleDiffs: SchemaDiff[] = [
  { path: '#/properties/name', type: 'added', newValue: { type: 'string' }, breaking: false },
  { path: '#/properties/age', type: 'removed', oldValue: { type: 'number' }, breaking: true },
  { path: '#/required', type: 'changed', oldValue: ['id'], newValue: ['id', 'name'], breaking: true },
];

describe('formatAsText', () => {
  it('renders a header and change lines', () => {
    const out = formatAsText(sampleDiffs, 'My Diff');
    expect(out).toContain('My Diff');
    expect(out).toContain('#/properties/name');
    expect(out).toContain('BREAKING');
  });

  it('handles empty diffs', () => {
    const out = formatAsText([]);
    expect(out).toContain('No changes detected');
  });
});

describe('formatAsMarkdown', () => {
  it('renders a markdown table', () => {
    const out = formatAsMarkdown(sampleDiffs);
    expect(out).toContain('| Status |');
    expect(out).toContain('#/properties/age');
    expect(out).toContain('⚠️ Yes');
  });

  it('handles empty diffs', () => {
    const out = formatAsMarkdown([]);
    expect(out).toContain('No changes detected');
  });
});

describe('formatAsJson', () => {
  it('returns valid JSON with changes array', () => {
    const out = formatAsJson(sampleDiffs, 'Test');
    const parsed = JSON.parse(out);
    expect(parsed.title).toBe('Test');
    expect(parsed.changes).toHaveLength(3);
  });
});

describe('formatOutput', () => {
  it('formats as text by default', () => {
    const out = formatOutput(sampleDiffs, { format: 'text' });
    expect(out).toContain('Schema Diff');
  });

  it('filters to breaking-only when includeBreaking is true', () => {
    const out = formatOutput(sampleDiffs, { format: 'json', includeBreaking: true });
    const parsed = JSON.parse(out);
    expect(parsed.changes.every((c: SchemaDiff) => c.breaking)).toBe(true);
    expect(parsed.changes).toHaveLength(2);
  });

  it('uses custom title', () => {
    const out = formatOutput(sampleDiffs, { format: 'markdown', title: 'Custom Title' });
    expect(out).toContain('Custom Title');
  });

  it('formats as markdown', () => {
    const out = formatOutput(sampleDiffs, { format: 'markdown' });
    expect(out).toContain('| Status |');
  });
});
