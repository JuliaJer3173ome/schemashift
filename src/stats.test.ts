import { computeDiffStats, formatStats, statsToJson } from './stats';
import { SchemaDiff } from './types';

const makeDiff = (overrides: Partial<SchemaDiff> = {}): SchemaDiff => ({
  path: 'properties.name',
  type: 'change',
  breaking: false,
  before: 'string',
  after: 'number',
  ...overrides,
});

describe('computeDiffStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = computeDiffStats([]);
    expect(stats.total).toBe(0);
    expect(stats.additions).toBe(0);
    expect(stats.removals).toBe(0);
    expect(stats.modifications).toBe(0);
    expect(stats.breaking).toBe(0);
    expect(stats.nonBreaking).toBe(0);
  });

  it('counts additions, removals, and modifications', () => {
    const diffs: SchemaDiff[] = [
      makeDiff({ type: 'add', path: 'properties.age', breaking: false }),
      makeDiff({ type: 'remove', path: 'properties.id', breaking: true }),
      makeDiff({ type: 'change', path: 'properties.name', breaking: false }),
    ];
    const stats = computeDiffStats(diffs);
    expect(stats.total).toBe(3);
    expect(stats.additions).toBe(1);
    expect(stats.removals).toBe(1);
    expect(stats.modifications).toBe(1);
  });

  it('counts breaking vs non-breaking', () => {
    const diffs: SchemaDiff[] = [
      makeDiff({ breaking: true }),
      makeDiff({ breaking: true }),
      makeDiff({ breaking: false }),
    ];
    const stats = computeDiffStats(diffs);
    expect(stats.breaking).toBe(2);
    expect(stats.nonBreaking).toBe(1);
  });

  it('groups changes by top-level path segment', () => {
    const diffs: SchemaDiff[] = [
      makeDiff({ path: 'properties.name' }),
      makeDiff({ path: 'properties.age' }),
      makeDiff({ path: 'required' }),
    ];
    const stats = computeDiffStats(diffs);
    expect(stats.byPath['properties']).toBe(2);
    expect(stats.byPath['required']).toBe(1);
  });

  it('groups changes by depth', () => {
    const diffs: SchemaDiff[] = [
      makeDiff({ path: '' }),
      makeDiff({ path: 'type' }),
      makeDiff({ path: 'properties.name' }),
    ];
    const stats = computeDiffStats(diffs);
    expect(stats.byDepth[0]).toBe(1);
    expect(stats.byDepth[1]).toBe(1);
    expect(stats.byDepth[2]).toBe(1);
  });
});

describe('formatStats', () => {
  it('returns a multi-line string summary', () => {
    const stats = computeDiffStats([
      makeDiff({ type: 'add', breaking: false, path: 'properties.x' }),
    ]);
    const output = formatStats(stats);
    expect(output).toContain('Total changes');
    expect(output).toContain('Additions');
    expect(output).toContain('Breaking');
    expect(output).toContain('properties');
  });
});

describe('statsToJson', () => {
  it('serializes stats to valid JSON', () => {
    const stats = computeDiffStats([makeDiff()]);
    const json = statsToJson(stats);
    const parsed = JSON.parse(json);
    expect(parsed.total).toBe(1);
    expect(typeof parsed.breaking).toBe('number');
  });
});
