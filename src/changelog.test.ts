import { buildChangelogEntry, formatChangelog, Changelog } from './changelog';
import { SchemaDiff, ChangeType } from './types';

const mockDiffs: SchemaDiff[] = [
  {
    path: 'properties.email',
    type: ChangeType.Added,
    oldValue: undefined,
    newValue: { type: 'string', format: 'email' },
  },
  {
    path: 'properties.age',
    type: ChangeType.Removed,
    oldValue: { type: 'integer' },
    newValue: undefined,
  },
  {
    path: 'properties.name.type',
    type: ChangeType.Modified,
    oldValue: 'string',
    newValue: 'integer',
  },
];

describe('buildChangelogEntry', () => {
  it('should group diffs by change type', () => {
    const entry = buildChangelogEntry(mockDiffs, '2.0.0', '2024-06-01');
    expect(entry.version).toBe('2.0.0');
    expect(entry.date).toBe('2024-06-01');
    expect(entry.additions).toHaveLength(1);
    expect(entry.removals).toHaveLength(1);
    expect(entry.modifications).toHaveLength(1);
  });

  it('should mark entry as breaking when removals or type changes exist', () => {
    const entry = buildChangelogEntry(mockDiffs, '2.0.0', '2024-06-01');
    expect(entry.breaking).toBe(true);
  });

  it('should not mark entry as breaking for additions only', () => {
    const addOnlyDiffs: SchemaDiff[] = [
      {
        path: 'properties.nickname',
        type: ChangeType.Added,
        oldValue: undefined,
        newValue: { type: 'string' },
      },
    ];
    const entry = buildChangelogEntry(addOnlyDiffs, '1.1.0', '2024-06-01');
    expect(entry.breaking).toBe(false);
  });

  it('should use today as default date when none provided', () => {
    const entry = buildChangelogEntry(mockDiffs, '2.0.0');
    const today = new Date().toISOString().split('T')[0];
    expect(entry.date).toBe(today);
  });
});

describe('formatChangelog', () => {
  it('should produce markdown output with schema name', () => {
    const entry = buildChangelogEntry(mockDiffs, '2.0.0', '2024-06-01');
    const changelog: Changelog = { schemaName: 'UserSchema', entries: [entry] };
    const output = formatChangelog(changelog);
    expect(output).toContain('# Changelog: UserSchema');
    expect(output).toContain('## [2.0.0] - 2024-06-01');
    expect(output).toContain('⚠️ BREAKING');
  });

  it('should include section headers for each change type', () => {
    const entry = buildChangelogEntry(mockDiffs, '2.0.0', '2024-06-01');
    const changelog: Changelog = { schemaName: 'UserSchema', entries: [entry] };
    const output = formatChangelog(changelog);
    expect(output).toContain('### Added');
    expect(output).toContain('### Removed');
    expect(output).toContain('### Modified');
  });

  it('should handle empty changelog entries', () => {
    const changelog: Changelog = { schemaName: 'EmptySchema', entries: [] };
    const output = formatChangelog(changelog);
    expect(output).toContain('# Changelog: EmptySchema');
    expect(output).not.toContain('##');
  });
});
