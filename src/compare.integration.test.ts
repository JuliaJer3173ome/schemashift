import { compareSchemas, schemasAreCompatible } from './compare';
import { scoreCompatibility } from './score';

const v1Schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string', description: 'Login username' },
    age: { type: 'integer' },
  },
  required: ['id', 'username'],
};

const v2Schema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    username: { type: 'string', description: 'Display name' },
    age: { type: 'integer' },
    email: { type: 'string', format: 'email' },
  },
  required: ['id', 'username', 'email'],
};

const v3Schema = {
  type: 'object',
  properties: {
    uid: { type: 'string' },
    displayName: { type: 'string' },
  },
  required: ['uid'],
};

describe('compare + score integration', () => {
  it('v1 -> v2: non-breaking addition detected', () => {
    const result = compareSchemas(v1Schema, v2Schema, { ignoreDescriptions: true });
    expect(result.areEqual).toBe(false);
    expect(result.addedCount).toBeGreaterThan(0);
    const score = scoreCompatibility(result);
    expect(score.grade).toMatch(/A|B/);
  });

  it('v1 -> v3: breaking changes detected', () => {
    const result = compareSchemas(v1Schema, v3Schema);
    expect(result.breakingCount).toBeGreaterThan(0);
    expect(schemasAreCompatible(v1Schema, v3Schema)).toBe(false);
    const score = scoreCompatibility(result);
    expect(['D', 'F', 'C']).toContain(score.grade);
  });

  it('identical schemas score 100', () => {
    const result = compareSchemas(v1Schema, v1Schema);
    const score = scoreCompatibility(result);
    expect(score.score).toBe(100);
    expect(result.areEqual).toBe(true);
  });

  it('ignoreDefaults does not affect type changes', () => {
    const source = { type: 'object', properties: { x: { type: 'string', default: 'a' } } };
    const target = { type: 'object', properties: { x: { type: 'integer', default: 0 } } };
    const result = compareSchemas(source, target, { ignoreDefaults: true });
    expect(result.breakingCount).toBeGreaterThan(0);
  });
});
