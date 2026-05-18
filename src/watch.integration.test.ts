import { createWatcher, watchSchemas } from './watch';
import { hasBreakingChanges } from './migrate';
import { summarizeDiff } from './summary';
import { JSONSchema } from './types';

describe('watch integration', () => {
  const base: JSONSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
    },
    required: ['id'],
  };

  it('detects breaking change when required field added', () => {
    const breaking: JSONSchema = {
      ...base,
      required: ['id', 'email'],
    };
    const watcher = createWatcher(base);
    const diffs = watcher.update(breaking);
    expect(hasBreakingChanges(diffs)).toBe(true);
  });

  it('detects non-breaking change when optional field added', () => {
    const extended: JSONSchema = {
      ...base,
      properties: { ...base.properties, name: { type: 'string' } },
    };
    const watcher = createWatcher(base);
    const diffs = watcher.update(extended);
    expect(diffs.length).toBeGreaterThan(0);
    expect(hasBreakingChanges(diffs)).toBe(false);
  });

  it('accumulates diffs across multiple updates', () => {
    const allDiffs: number[] = [];
    const watcher = createWatcher(base, {
      onchange: (diffs) => allDiffs.push(diffs.length),
    });

    watcher.update({ ...base, properties: { ...base.properties, x: { type: 'string' } } });
    watcher.update({ ...base, properties: { ...base.properties, x: { type: 'string' }, y: { type: 'number' } } });

    expect(allDiffs).toHaveLength(2);
    expect(allDiffs[0]).toBeGreaterThan(0);
    expect(allDiffs[1]).toBeGreaterThan(0);
  });

  it('watchSchemas integrates with summarizeDiff', () => {
    const v2: JSONSchema = { ...base, properties: { ...base.properties, role: { type: 'string' } } };
    const v3: JSONSchema = { ...v2, required: ['id', 'role'] };

    const results = watchSchemas([base, v2, v3]);
    const summaries = results.map(summarizeDiff);

    expect(summaries[0].totalChanges).toBeGreaterThan(0);
    expect(summaries[1].totalChanges).toBeGreaterThan(0);
    expect(summaries[1].breakingChanges).toBeGreaterThan(0);
  });
});
