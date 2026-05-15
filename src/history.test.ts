import {
  createHistory,
  addHistoryEntry,
  getHistoryEntry,
  getLatestEntry,
  clearHistory,
  formatHistorySummary,
} from './history';
import { SchemaDiff } from './types';

const mockDiffs: SchemaDiff[] = [
  { type: 'added', path: '#/properties/name', value: { type: 'string' } },
];

const schemaA = { type: 'object', properties: {} };
const schemaB = { type: 'object', properties: { name: { type: 'string' } } };

describe('createHistory', () => {
  it('creates an empty history', () => {
    const h = createHistory();
    expect(h.entries).toHaveLength(0);
  });
});

describe('addHistoryEntry', () => {
  it('adds an entry to history', () => {
    const h = createHistory();
    const entry = addHistoryEntry(h, schemaA, schemaB, mockDiffs, 'v1 -> v2');
    expect(h.entries).toHaveLength(1);
    expect(entry.label).toBe('v1 -> v2');
    expect(entry.diffs).toHaveLength(1);
  });

  it('assigns a unique id and timestamp', () => {
    const h = createHistory();
    const e1 = addHistoryEntry(h, schemaA, schemaB, mockDiffs);
    const e2 = addHistoryEntry(h, schemaB, schemaA, []);
    expect(e1.id).not.toBe(e2.id);
    expect(e1.timestamp).toBeDefined();
  });
});

describe('getHistoryEntry', () => {
  it('retrieves an entry by id', () => {
    const h = createHistory();
    const entry = addHistoryEntry(h, schemaA, schemaB, mockDiffs);
    const found = getHistoryEntry(h, entry.id);
    expect(found).toBe(entry);
  });

  it('returns undefined for unknown id', () => {
    const h = createHistory();
    expect(getHistoryEntry(h, 'nonexistent')).toBeUndefined();
  });
});

describe('getLatestEntry', () => {
  it('returns undefined for empty history', () => {
    const h = createHistory();
    expect(getLatestEntry(h)).toBeUndefined();
  });

  it('returns the most recent entry', () => {
    const h = createHistory();
    addHistoryEntry(h, schemaA, schemaB, mockDiffs, 'first');
    const last = addHistoryEntry(h, schemaB, schemaA, [], 'second');
    expect(getLatestEntry(h)).toBe(last);
  });
});

describe('clearHistory', () => {
  it('removes all entries', () => {
    const h = createHistory();
    addHistoryEntry(h, schemaA, schemaB, mockDiffs);
    clearHistory(h);
    expect(h.entries).toHaveLength(0);
  });
});

describe('formatHistorySummary', () => {
  it('returns message for empty history', () => {
    const h = createHistory();
    expect(formatHistorySummary(h)).toBe('No history entries.');
  });

  it('formats entries with label and change count', () => {
    const h = createHistory();
    addHistoryEntry(h, schemaA, schemaB, mockDiffs, 'v1');
    const summary = formatHistorySummary(h);
    expect(summary).toContain('v1');
    expect(summary).toContain('1 change(s)');
  });
});
