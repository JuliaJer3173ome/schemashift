import { SchemaDiff } from './types';

export type GroupKey = 'additions' | 'removals' | 'modifications' | 'renames';

export interface GroupedDiffs {
  additions: SchemaDiff[];
  removals: SchemaDiff[];
  modifications: SchemaDiff[];
  renames: SchemaDiff[];
}

export function groupDiffsByChangeType(diffs: SchemaDiff[]): GroupedDiffs {
  const result: GroupedDiffs = {
    additions: [],
    removals: [],
    modifications: [],
    renames: [],
  };

  for (const diff of diffs) {
    switch (diff.type) {
      case 'added':
        result.additions.push(diff);
        break;
      case 'removed':
        result.removals.push(diff);
        break;
      case 'changed':
        result.modifications.push(diff);
        break;
      default:
        result.modifications.push(diff);
    }
  }

  return result;
}

export function groupDiffsByPath(diffs: SchemaDiff[]): Record<string, SchemaDiff[]> {
  const result: Record<string, SchemaDiff[]> = {};

  for (const diff of diffs) {
    const topLevel = diff.path.split('.')[0] || '(root)';
    if (!result[topLevel]) {
      result[topLevel] = [];
    }
    result[topLevel].push(diff);
  }

  return result;
}

export function groupDiffsByDepth(diffs: SchemaDiff[]): Record<number, SchemaDiff[]> {
  const result: Record<number, SchemaDiff[]> = {};

  for (const diff of diffs) {
    const depth = diff.path === '' ? 0 : diff.path.split('.').length;
    if (!result[depth]) {
      result[depth] = [];
    }
    result[depth].push(diff);
  }

  return result;
}

export function flattenGroups(grouped: GroupedDiffs): SchemaDiff[] {
  return [
    ...grouped.additions,
    ...grouped.removals,
    ...grouped.modifications,
    ...grouped.renames,
  ];
}

export function countByGroup(grouped: GroupedDiffs): Record<GroupKey, number> {
  return {
    additions: grouped.additions.length,
    removals: grouped.removals.length,
    modifications: grouped.modifications.length,
    renames: grouped.renames.length,
  };
}
