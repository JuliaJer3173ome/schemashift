import { createWatcher, watchSchemas } from './watch';
import { JSONSchema } from './types';

const schemaV1: JSONSchema = {
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name'],
};

const schemaV2: JSONSchema = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'number' } },
  required: ['name'],
};

const schemaV3: JSONSchema = {
  type: 'object',
  properties: { name: { type: 'string' }, age: { type: 'number' } },
  required: ['name', 'age'],
};

describe('createWatcher', () => {
  it('returns current schema', () => {
    const watcher = createWatcher(schemaV1);
    expect(watcher.current()).toEqual(schemaV1);
  });

  it('detects changes on update', () => {
    const watcher = createWatcher(schemaV1);
    const diffs = watcher.update(schemaV2);
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('calls onchange callback when diffs exist', () => {
    const onchange = jest.fn();
    const watcher = createWatcher(schemaV1, { onchange });
    watcher.update(schemaV2);
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange.mock.calls[0][0].length).toBeGreaterThan(0);
  });

  it('does not call onchange when schemas are identical', () => {
    const onchange = jest.fn();
    const watcher = createWatcher(schemaV1, { onchange });
    watcher.update({ ...schemaV1 });
    expect(onchange).not.toHaveBeenCalled();
  });

  it('updates current schema after update', () => {
    const watcher = createWatcher(schemaV1);
    watcher.update(schemaV2);
    expect(watcher.current()).toEqual(schemaV2);
  });

  it('returns empty diffs after stop', () => {
    const watcher = createWatcher(schemaV1);
    watcher.handle.stop();
    const diffs = watcher.update(schemaV2);
    expect(diffs).toEqual([]);
    expect(watcher.handle.isRunning()).toBe(false);
  });

  it('calls onerror on exception', () => {
    const onerror = jest.fn();
    const watcher = createWatcher(schemaV1, { onerror });
    // Force an error by passing invalid schema
    watcher.update(null as any);
    expect(onerror).toHaveBeenCalled();
  });
});

describe('watchSchemas', () => {
  it('returns diffs for each adjacent pair', () => {
    const results = watchSchemas([schemaV1, schemaV2, schemaV3]);
    expect(results).toHaveLength(2);
    expect(results[0].length).toBeGreaterThan(0);
    expect(results[1].length).toBeGreaterThan(0);
  });

  it('returns empty array for single schema', () => {
    const results = watchSchemas([schemaV1]);
    expect(results).toEqual([]);
  });

  it('fires onchange for each changed pair', () => {
    const onchange = jest.fn();
    watchSchemas([schemaV1, schemaV2, schemaV3], { onchange });
    expect(onchange).toHaveBeenCalledTimes(2);
  });
});
