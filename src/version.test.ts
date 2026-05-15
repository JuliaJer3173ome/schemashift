import {
  parseSemver,
  bumpVersion,
  suggestBump,
  createVersionBump,
  compareVersions,
  SchemaVersion,
} from './version';
import { SchemaDiff } from './types';

const makeVersion = (version: string, schema = {}): SchemaVersion => ({
  version,
  schema,
  createdAt: '2024-01-01T00:00:00.000Z',
});

describe('parseSemver', () => {
  it('parses valid version', () => {
    expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
  });
  it('strips leading v', () => {
    expect(parseSemver('v2.0.0')).toEqual([2, 0, 0]);
  });
  it('throws on invalid version', () => {
    expect(() => parseSemver('not-a-version')).toThrow('Invalid semver');
  });
});

describe('bumpVersion', () => {
  it('bumps major', () => {
    expect(bumpVersion('1.2.3', 'major')).toBe('2.0.0');
  });
  it('bumps minor', () => {
    expect(bumpVersion('1.2.3', 'minor')).toBe('1.3.0');
  });
  it('bumps patch', () => {
    expect(bumpVersion('1.2.3', 'patch')).toBe('1.2.4');
  });
});

describe('suggestBump', () => {
  it('returns major for breaking changes', () => {
    const diffs: SchemaDiff[] = [{ type: 'removed', path: 'name', before: 'string', after: undefined }];
    expect(suggestBump(diffs)).toBe('major');
  });
  it('returns minor for additions', () => {
    const diffs: SchemaDiff[] = [{ type: 'added', path: 'age', before: undefined, after: 'number' }];
    expect(suggestBump(diffs)).toBe('minor');
  });
  it('returns patch for other changes', () => {
    const diffs: SchemaDiff[] = [{ type: 'modified', path: 'desc', before: 'old', after: 'new' }];
    expect(suggestBump(diffs)).toBe('patch');
  });
  it('returns patch for empty diffs', () => {
    expect(suggestBump([])).toBe('patch');
  });
});

describe('createVersionBump', () => {
  it('creates a version bump with suggested type', () => {
    const from = makeVersion('1.0.0', { type: 'object', properties: { name: { type: 'string' } } });
    const to = { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } };
    const result = createVersionBump(from, to, 'added age field');
    expect(result.type).toBe('minor');
    expect(result.to).toBe('1.1.0');
    expect(result.next.description).toBe('added age field');
    expect(result.next.schema).toEqual(to);
  });
});

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
  });
  it('returns positive when a > b', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
  });
  it('returns negative when a < b', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBeLessThan(0);
  });
});
