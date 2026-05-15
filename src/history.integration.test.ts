import { createHistory, addHistoryEntry, formatHistorySummary } from './history';
import { diffSchemas } from './diff';

const schemaV1 = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
  },
  required: ['id'],
};

const schemaV2 = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
  },
  required: ['id', 'name'],
};

const schemaV3 = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'name'],
};

describe('history integration with diffSchemas', () => {
  it('records multiple schema evolution steps', () => {
    const history = createHistory();

    const diffs1 = diffSchemas(schemaV1, schemaV2);
    addHistoryEntry(history, schemaV1, schemaV2, diffs1, 'v1 -> v2');

    const diffs2 = diffSchemas(schemaV2, schemaV3);
    addHistoryEntry(history, schemaV2, schemaV3, diffs2, 'v2 -> v3');

    expect(history.entries).toHaveLength(2);
    expect(history.entries[0].diffs.length).toBeGreaterThan(0);
    expect(history.entries[1].diffs.length).toBeGreaterThan(0);
  });

  it('produces a readable summary of schema evolution', () => {
    const history = createHistory();

    const diffs1 = diffSchemas(schemaV1, schemaV2);
    addHistoryEntry(history, schemaV1, schemaV2, diffs1, 'v1 -> v2');

    const summary = formatHistorySummary(history);
    expect(summary).toContain('v1 -> v2');
    expect(summary).toMatch(/\d+ change\(s\)/);
  });

  it('preserves fromSchema and toSchema snapshots', () => {
    const history = createHistory();
    const diffs = diffSchemas(schemaV1, schemaV2);
    addHistoryEntry(history, schemaV1, schemaV2, diffs);

    const entry = history.entries[0];
    expect(entry.fromSchema).toEqual(schemaV1);
    expect(entry.toSchema).toEqual(schemaV2);
  });
});
