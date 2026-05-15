import { JSONSchema, SchemaDiff } from './types';
import { diffSchemas } from './diff';

export interface SchemaVersion {
  version: string;
  schema: JSONSchema;
  createdAt: string;
  description?: string;
}

export interface VersionBump {
  from: string;
  to: string;
  type: 'major' | 'minor' | 'patch';
  diffs: SchemaDiff[];
}

export function parseSemver(version: string): [number, number, number] {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver: ${version}`);
  }
  return [parts[0], parts[1], parts[2]];
}

export function bumpVersion(
  current: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const [major, minor, patch] = parseSemver(current);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export function suggestBump(
  diffs: SchemaDiff[]
): 'major' | 'minor' | 'patch' {
  const breakingTypes: SchemaDiff['type'][] = ['removed', 'type-changed'];
  const hasBreaking = diffs.some((d) => breakingTypes.includes(d.type));
  if (hasBreaking) return 'major';
  const hasAdditions = diffs.some((d) => d.type === 'added');
  if (hasAdditions) return 'minor';
  return 'patch';
}

export function createVersionBump(
  from: SchemaVersion,
  to: JSONSchema,
  description?: string
): VersionBump & { next: SchemaVersion } {
  const diffs = diffSchemas(from.schema, to);
  const type = suggestBump(diffs);
  const nextVersion = bumpVersion(from.version, type);
  return {
    from: from.version,
    to: nextVersion,
    type,
    diffs,
    next: {
      version: nextVersion,
      schema: to,
      createdAt: new Date().toISOString(),
      description,
    },
  };
}

export function compareVersions(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = parseSemver(a);
  const [bMaj, bMin, bPatch] = parseSemver(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}
