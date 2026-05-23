import { SchemaDefinition, DiffResult } from './types';

export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  ttl?: number;
}

export interface DiffCache {
  get(key: string): DiffResult[] | undefined;
  set(key: string, value: DiffResult[], ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
}

export function buildCacheKey(from: SchemaDefinition, to: SchemaDefinition): string {
  return JSON.stringify({ from, to });
}

export function isExpired(entry: CacheEntry<unknown>): boolean {
  if (entry.ttl === undefined) return false;
  return Date.now() > entry.createdAt + entry.ttl;
}

export function createDiffCache(defaultTtl?: number): DiffCache {
  const store = new Map<string, CacheEntry<DiffResult[]>>();

  return {
    get(key: string): DiffResult[] | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },

    set(key: string, value: DiffResult[], ttl?: number): void {
      store.set(key, {
        value,
        createdAt: Date.now(),
        ttl: ttl ?? defaultTtl,
      });
    },

    has(key: string): boolean {
      const entry = store.get(key);
      if (!entry) return false;
      if (isExpired(entry)) {
        store.delete(key);
        return false;
      }
      return true;
    },

    delete(key: string): boolean {
      return store.delete(key);
    },

    clear(): void {
      store.clear();
    },

    size(): number {
      for (const [key, entry] of store.entries()) {
        if (isExpired(entry)) store.delete(key);
      }
      return store.size;
    },
  };
}

export function withCache(
  cache: DiffCache,
  fn: (from: SchemaDefinition, to: SchemaDefinition) => DiffResult[],
  ttl?: number
): (from: SchemaDefinition, to: SchemaDefinition) => DiffResult[] {
  return (from, to) => {
    const key = buildCacheKey(from, to);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(from, to);
    cache.set(key, result, ttl);
    return result;
  };
}
