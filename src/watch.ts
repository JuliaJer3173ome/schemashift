import { JSONSchema } from './types';
import { diffSchemas } from './diff';
import { SchemaDiff } from './types';

export interface WatchOptions {
  interval?: number;
  onchange?: (diff: SchemaDiff[], prev: JSONSchema, next: JSONSchema) => void;
  onerror?: (err: Error) => void;
}

export interface WatchHandle {
  stop: () => void;
  isRunning: () => boolean;
}

export interface SchemaWatcher {
  current: () => JSONSchema;
  update: (next: JSONSchema) => SchemaDiff[];
  handle: WatchHandle;
}

export function createWatcher(
  initial: JSONSchema,
  options: WatchOptions = {}
): SchemaWatcher {
  let current: JSONSchema = { ...initial };
  let running = true;

  const handle: WatchHandle = {
    stop: () => { running = false; },
    isRunning: () => running,
  };

  const update = (next: JSONSchema): SchemaDiff[] => {
    if (!running) return [];
    try {
      const diffs = diffSchemas(current, next);
      if (diffs.length > 0 && options.onchange) {
        options.onchange(diffs, current, next);
      }
      current = { ...next };
      return diffs;
    } catch (err) {
      if (options.onerror) options.onerror(err as Error);
      return [];
    }
  };

  return {
    current: () => ({ ...current }),
    update,
    handle,
  };
}

export function watchSchemas(
  schemas: JSONSchema[],
  options: WatchOptions = {}
): SchemaDiff[][] {
  if (schemas.length < 2) return [];
  const results: SchemaDiff[][] = [];
  for (let i = 0; i < schemas.length - 1; i++) {
    try {
      const diffs = diffSchemas(schemas[i], schemas[i + 1]);
      results.push(diffs);
      if (diffs.length > 0 && options.onchange) {
        options.onchange(diffs, schemas[i], schemas[i + 1]);
      }
    } catch (err) {
      if (options.onerror) options.onerror(err as Error);
      results.push([]);
    }
  }
  return results;
}
