import { describe, it, expect } from 'vitest';
import {
  isBreakingChange,
  diffToMigrationStep,
  generateMigrations,
  hasBreakingChanges,
  applyMigrations,
} from './migrate';
import { SchemaDiff } from './types';

describe('isBreakingChange', () => {
  it('marks removed as breaking', () => {
    const diff: SchemaDiff = { type: 'removed', path: 'properties.name' };
    expect(isBreakingChange(diff)).toBe(true);
  });

  it('marks type_changed as breaking', () => {
    const diff: SchemaDiff = { type: 'type_changed', path: 'type', oldValue: 'string', value: 'number' };
    expect(isBreakingChange(diff)).toBe(true);
  });

  it('does not mark added as breaking', () => {
    const diff: SchemaDiff = { type: 'added', path: 'properties.age', value: { type: 'number' } };
    expect(isBreakingChange(diff)).toBe(false);
  });
});

describe('diffToMigrationStep', () => {
  it('converts added diff to add step', () => {
    const diff: SchemaDiff = { type: 'added', path: 'properties.age', value: { type: 'number' } };
    const step = diffToMigrationStep(diff);
    expect(step.operation).toBe('add');
    expect(step.path).toBe('properties.age');
    expect(step.value).toEqual({ type: 'number' });
  });

  it('converts removed diff to remove step', () => {
    const diff: SchemaDiff = { type: 'removed', path: 'properties.name' };
    const step = diffToMigrationStep(diff);
    expect(step.operation).toBe('remove');
  });

  it('converts changed diff to replace step', () => {
    const diff: SchemaDiff = { type: 'changed', path: 'description', oldValue: 'old', value: 'new' };
    const step = diffToMigrationStep(diff);
    expect(step.operation).toBe('replace');
    expect(step.value).toBe('new');
  });
});

describe('hasBreakingChanges', () => {
  it('returns true when breaking changes exist', () => {
    const diffs: SchemaDiff[] = [
      { type: 'added', path: 'properties.x' },
      { type: 'removed', path: 'properties.y' },
    ];
    expect(hasBreakingChanges(diffs)).toBe(true);
  });

  it('returns false when no breaking changes', () => {
    const diffs: SchemaDiff[] = [{ type: 'added', path: 'properties.x' }];
    expect(hasBreakingChanges(diffs)).toBe(false);
  });
});

describe('applyMigrations', () => {
  it('applies add migration', () => {
    const schema = { type: 'object', properties: {} };
    const steps = generateMigrations([{ type: 'added', path: 'properties.age', value: { type: 'number' } }]);
    const result = applyMigrations(schema as Record<string, unknown>, steps);
    expect((result.properties as Record<string, unknown>).age).toEqual({ type: 'number' });
  });

  it('applies remove migration', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const steps = generateMigrations([{ type: 'removed', path: 'properties.name' }]);
    const result = applyMigrations(schema as Record<string, unknown>, steps);
    expect((result.properties as Record<string, unknown>).name).toBeUndefined();
  });
});
