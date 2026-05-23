import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildCacheKey,
  isExpired,
  createDiffCache,
  withCache,
  CacheEntry,
} from './cache';
import { DiffResult } from './types';

const mockDiffs: DiffResult[] = [
  { type: 'added', path: 'properties.name', value: { type: 'string' } },
];

const schemaA = { type: 'object', properties: { id: { type: 'number' } } };
const schemaB = { type: 'object', properties: { id: { type: 'string' } } };

describe('buildCacheKey', () => {
  it('produces a deterministic string key', () => {
    const key1 = buildCacheKey(schemaA, schemaB);
    const key2 = buildCacheKey(schemaA, schemaB);
    expect(key1).toBe(key2);
  });

  it('produces different keys for different schemas', () => {
    const key1 = buildCacheKey(schemaA, schemaB);
    const key2 = buildCacheKey(schemaB, schemaA);
    expect(key1).not.toBe(key2);
  });
});

describe('isExpired', () => {
  it('returns false when no ttl is set', () => {
    const entry: CacheEntry<unknown> = { value: 1, createdAt: Date.now() - 10000 };
    expect(isExpired(entry)).toBe(false);
  });

  it('returns false when within ttl', () => {
    const entry: CacheEntry<unknown> = { value: 1, createdAt: Date.now(), ttl: 5000 };
    expect(isExpired(entry)).toBe(false);
  });

  it('returns true when past ttl', () => {
    const entry: CacheEntry<unknown> = { value: 1, createdAt: Date.now() - 6000, ttl: 5000 };
    expect(isExpired(entry)).toBe(true);
  });
});

describe('createDiffCache', () => {
  let cache: ReturnType<typeof createDiffCache>;

  beforeEach(() => {
    cache = createDiffCache();
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves values', () => {
    cache.set('key1', mockDiffs);
    expect(cache.get('key1')).toEqual(mockDiffs);
  });

  it('reports correct size', () => {
    cache.set('a', mockDiffs);
    cache.set('b', mockDiffs);
    expect(cache.size()).toBe(2);
  });

  it('deletes entries', () => {
    cache.set('key1', mockDiffs);
    cache.delete('key1');
    expect(cache.has('key1')).toBe(false);
  });

  it('clears all entries', () => {
    cache.set('a', mockDiffs);
    cache.set('b', mockDiffs);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('evicts expired entries on get', () => {
    cache.set('expired', mockDiffs, 1);
    return new Promise<void>((resolve) =>
      setTimeout(() => {
        expect(cache.get('expired')).toBeUndefined();
        resolve();
      }, 10)
    );
  });
});

describe('withCache', () => {
  it('calls fn once and caches result', () => {
    const cache = createDiffCache();
    const fn = vi.fn().mockReturnValue(mockDiffs);
    const cached = withCache(cache, fn);

    const r1 = cached(schemaA, schemaB);
    const r2 = cached(schemaA, schemaB);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(r2);
  });

  it('calls fn again for different schemas', () => {
    const cache = createDiffCache();
    const fn = vi.fn().mockReturnValue(mockDiffs);
    const cached = withCache(cache, fn);

    cached(schemaA, schemaB);
    cached(schemaB, schemaA);

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
