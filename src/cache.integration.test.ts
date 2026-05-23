import { describe, it, expect } from 'vitest';
import { createDiffCache, withCache } from './cache';
import { diffSchemas } from './diff';

const schemaV1 = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
  },
  required: ['id'],
};

const schemaV2 = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'email'],
};

describe('cache + diffSchemas integration', () => {
  it('caches diffSchemas results and returns identical output', () => {
    const cache = createDiffCache();
    const cachedDiff = withCache(cache, diffSchemas);

    const result1 = cachedDiff(schemaV1, schemaV2);
    const result2 = cachedDiff(schemaV1, schemaV2);

    expect(result1).toEqual(result2);
    expect(cache.size()).toBe(1);
  });

  it('computes separate cache entries for swapped schemas', () => {
    const cache = createDiffCache();
    const cachedDiff = withCache(cache, diffSchemas);

    const forward = cachedDiff(schemaV1, schemaV2);
    const backward = cachedDiff(schemaV2, schemaV1);

    expect(cache.size()).toBe(2);
    expect(forward).not.toEqual(backward);
  });

  it('respects ttl and recomputes after expiry', async () => {
    const cache = createDiffCache(10);
    const cachedDiff = withCache(cache, diffSchemas, 10);

    cachedDiff(schemaV1, schemaV2);
    expect(cache.size()).toBe(1);

    await new Promise((r) => setTimeout(r, 20));

    expect(cache.size()).toBe(0);
    cachedDiff(schemaV1, schemaV2);
    expect(cache.size()).toBe(1);
  });

  it('clearing cache forces recomputation', () => {
    const cache = createDiffCache();
    let callCount = 0;
    const trackingDiff = (a: object, b: object) => {
      callCount++;
      return diffSchemas(a, b);
    };
    const cachedDiff = withCache(cache, trackingDiff);

    cachedDiff(schemaV1, schemaV2);
    cache.clear();
    cachedDiff(schemaV1, schemaV2);

    expect(callCount).toBe(2);
  });
});
