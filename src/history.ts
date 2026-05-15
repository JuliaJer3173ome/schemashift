import { SchemaDiff } from './types';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  label?: string;
  fromSchema: Record<string, unknown>;
  toSchema: Record<string, unknown>;
  diffs: SchemaDiff[];
}

export interface SchemaHistory {
  entries: HistoryEntry[];
}

let _idCounter = 0;

function generateId(): string {
  _idCounter += 1;
  return `entry-${Date.now()}-${_idCounter}`;
}

export function createHistory(): SchemaHistory {
  return { entries: [] };
}

export function addHistoryEntry(
  history: SchemaHistory,
  fromSchema: Record<string, unknown>,
  toSchema: Record<string, unknown>,
  diffs: SchemaDiff[],
  label?: string
): HistoryEntry {
  const entry: HistoryEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    label,
    fromSchema,
    toSchema,
    diffs,
  };
  history.entries.push(entry);
  return entry;
}

export function getHistoryEntry(
  history: SchemaHistory,
  id: string
): HistoryEntry | undefined {
  return history.entries.find((e) => e.id === id);
}

export function getLatestEntry(
  history: SchemaHistory
): HistoryEntry | undefined {
  if (history.entries.length === 0) return undefined;
  return history.entries[history.entries.length - 1];
}

export function clearHistory(history: SchemaHistory): void {
  history.entries = [];
}

export function formatHistorySummary(history: SchemaHistory): string {
  if (history.entries.length === 0) {
    return 'No history entries.';
  }
  return history.entries
    .map((e) => {
      const label = e.label ? ` (${e.label})` : '';
      return `[${e.id}]${label} at ${e.timestamp} — ${e.diffs.length} change(s)`;
    })
    .join('\n');
}
