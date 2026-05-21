import { SchemaDiff } from './types';

export function dedupeKey(diff: SchemaDiff): string {
  return `${diff.type}::${diff.path}::${JSON.stringify(diff.before)}::${JSON.stringify(diff.after)}`;
}

export function dedupeDiffs(diffs: SchemaDiff[]): SchemaDiff[] {
  const seen = new Set<string>();
  const result: SchemaDiff[] = [];

  for (const diff of diffs) {
    const key = dedupeKey(diff);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(diff);
    }
  }

  return result;
}

export function mergeDuplicates(diffs: SchemaDiff[]): SchemaDiff[] {
  const pathMap = new Map<string, SchemaDiff[]>();

  for (const diff of diffs) {
    const existing = pathMap.get(diff.path) ?? [];
    pathMap.set(diff.path, [...existing, diff]);
  }

  const result: SchemaDiff[] = [];

  for (const [, group] of pathMap) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    // If a path has both an 'add' and 'remove', collapse to a single 'change'
    const types = group.map((d) => d.type);
    const hasAdd = types.includes('add');
    const hasRemove = types.includes('remove');

    if (hasAdd && hasRemove) {
      const removeDiff = group.find((d) => d.type === 'remove')!;
      const addDiff = group.find((d) => d.type === 'add')!;
      result.push({
        type: 'change',
        path: removeDiff.path,
        before: removeDiff.before,
        after: addDiff.after,
      });
    } else {
      // Keep only the last diff for the same path/type
      result.push(group[group.length - 1]);
    }
  }

  return result;
}

export function countDuplicates(diffs: SchemaDiff[]): number {
  return diffs.length - dedupeDiffs(diffs).length;
}
