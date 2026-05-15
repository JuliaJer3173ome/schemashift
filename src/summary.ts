import { SchemaDiff, ChangeType } from './types';

export interface DiffSummary {
  totalChanges: number;
  breakingChanges: number;
  nonBreakingChanges: number;
  addedFields: string[];
  removedFields: string[];
  modifiedFields: string[];
  changesByType: Record<ChangeType, number>;
}

export function summarizeDiff(diffs: SchemaDiff[]): DiffSummary {
  const addedFields: string[] = [];
  const removedFields: string[] = [];
  const modifiedFields: string[] = [];
  const changesByType: Partial<Record<ChangeType, number>> = {};

  let breakingChanges = 0;

  for (const diff of diffs) {
    const type = diff.type;
    changesByType[type] = (changesByType[type] ?? 0) + 1;

    if (type === 'added') {
      addedFields.push(diff.path);
    } else if (type === 'removed') {
      removedFields.push(diff.path);
      breakingChanges++;
    } else if (type === 'changed') {
      modifiedFields.push(diff.path);
      if (isBreakingModification(diff)) {
        breakingChanges++;
      }
    } else if (type === 'type-changed') {
      modifiedFields.push(diff.path);
      breakingChanges++;
    }
  }

  return {
    totalChanges: diffs.length,
    breakingChanges,
    nonBreakingChanges: diffs.length - breakingChanges,
    addedFields,
    removedFields,
    modifiedFields,
    changesByType: changesByType as Record<ChangeType, number>,
  };
}

function isBreakingModification(diff: SchemaDiff): boolean {
  const breakingKeys = ['minLength', 'minimum', 'minItems', 'required', 'enum'];
  return breakingKeys.some((key) => diff.path.endsWith(key));
}

export function formatSummary(summary: DiffSummary): string {
  const lines: string[] = [
    `Total changes: ${summary.totalChanges}`,
    `Breaking changes: ${summary.breakingChanges}`,
    `Non-breaking changes: ${summary.nonBreakingChanges}`,
  ];

  if (summary.addedFields.length > 0) {
    lines.push(`Added (${summary.addedFields.length}): ${summary.addedFields.join(', ')}`);
  }
  if (summary.removedFields.length > 0) {
    lines.push(`Removed (${summary.removedFields.length}): ${summary.removedFields.join(', ')}`);
  }
  if (summary.modifiedFields.length > 0) {
    lines.push(`Modified (${summary.modifiedFields.length}): ${summary.modifiedFields.join(', ')}`);
  }

  return lines.join('\n');
}
