import { JSONSchema, DiffResult } from './types';
import { flattenSchema } from './flatten';
import { collectPaths } from './traverse';

export interface SearchMatch {
  path: string;
  type: 'property' | 'type' | 'description' | 'enum';
  value: unknown;
  score: number;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  matchPartial?: boolean;
  maxResults?: number;
}

function normalize(val: string, caseSensitive: boolean): string {
  return caseSensitive ? val : val.toLowerCase();
}

export function searchSchema(
  schema: JSONSchema,
  query: string,
  options: SearchOptions = {}
): SearchMatch[] {
  const { caseSensitive = false, matchPartial = true, maxResults = 50 } = options;
  const q = normalize(query, caseSensitive);
  const flat = flattenSchema(schema);
  const results: SearchMatch[] = [];

  for (const [path, node] of Object.entries(flat)) {
    const nodeAny = node as Record<string, unknown>;

    const checks: Array<[SearchMatch['type'], unknown]> = [
      ['property', path.split('.').pop()],
      ['type', nodeAny['type']],
      ['description', nodeAny['description']],
      ['enum', Array.isArray(nodeAny['enum']) ? (nodeAny['enum'] as unknown[]).join(',') : undefined],
    ];

    for (const [type, raw] of checks) {
      if (raw == null) continue;
      const haystack = normalize(String(raw), caseSensitive);
      const matched = matchPartial ? haystack.includes(q) : haystack === q;
      if (matched) {
        const score = haystack === q ? 1 : q.length / haystack.length;
        results.push({ path, type, value: raw, score });
        break;
      }
    }

    if (results.length >= maxResults) break;
  }

  return results.sort((a, b) => b.score - a.score);
}

export function searchDiff(
  diffs: DiffResult[],
  query: string,
  options: SearchOptions = {}
): DiffResult[] {
  const { caseSensitive = false, matchPartial = true, maxResults = 50 } = options;
  const q = normalize(query, caseSensitive);

  return diffs
    .filter((d) => {
      const haystack = normalize(d.path, caseSensitive);
      return matchPartial ? haystack.includes(q) : haystack === q;
    })
    .slice(0, maxResults);
}

export function formatSearchResults(matches: SearchMatch[]): string {
  if (matches.length === 0) return 'No results found.';
  return matches
    .map((m) => `[${m.type}] ${m.path}: ${JSON.stringify(m.value)} (score: ${m.score.toFixed(2)})`)
    .join('\n');
}
