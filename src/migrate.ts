import { SchemaDiff, MigrationStep } from './types';

const BREAKING_DIFF_TYPES: SchemaDiff['type'][] = ['removed', 'type_changed'];

export function isBreakingChange(diff: SchemaDiff): boolean {
  return BREAKING_DIFF_TYPES.includes(diff.type);
}

export function diffToMigrationStep(diff: SchemaDiff): MigrationStep {
  switch (diff.type) {
    case 'added':
      return {
        operation: 'add',
        path: diff.path,
        value: diff.value,
        description: `Add property at ${diff.path || 'root'}`,
      };
    case 'removed':
      return {
        operation: 'remove',
        path: diff.path,
        description: `Remove property at ${diff.path || 'root'}`,
      };
    case 'changed':
      return {
        operation: 'replace',
        path: diff.path,
        value: diff.value,
        description: `Replace value at ${diff.path || 'root'}`,
      };
    case 'type_changed':
      return {
        operation: 'replace',
        path: diff.path,
        value: diff.value,
        description: `Change type at ${diff.path || 'root'} from ${diff.oldValue} to ${diff.value}`,
      };
  }
}

export function generateMigrations(diffs: SchemaDiff[]): MigrationStep[] {
  return diffs.map(diffToMigrationStep);
}

export function hasBreakingChanges(diffs: SchemaDiff[]): boolean {
  return diffs.some(isBreakingChange);
}

export function applyMigrations(
  schema: Record<string, unknown>,
  steps: MigrationStep[]
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;

  for (const step of steps) {
    const parts = step.path ? step.path.split('.').filter(Boolean) : [];

    if (step.operation === 'add' || step.operation === 'replace') {
      if (parts.length === 0) continue;
      let target: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in target)) target[parts[i]] = {};
        target = target[parts[i]] as Record<string, unknown>;
      }
      target[parts[parts.length - 1]] = step.value;
    } else if (step.operation === 'remove') {
      if (parts.length === 0) continue;
      let target: Record<string, unknown> = result;
      for (let i = 0; i < parts.length - 1; i++) {
        target = target[parts[i]] as Record<string, unknown>;
        if (!target) break;
      }
      if (target) delete target[parts[parts.length - 1]];
    }
  }

  return result;
}
