import { SchemaDiff } from './types';

export interface TaggedDiff {
  diff: SchemaDiff;
  tags: string[];
}

export interface TagIndex {
  [tag: string]: SchemaDiff[];
}

export function tagDiff(diff: SchemaDiff, tags: string[]): TaggedDiff {
  return { diff, tags: tags.map(t => t.toLowerCase().trim()).filter(Boolean) };
}

export function tagDiffs(diffs: SchemaDiff[], tagger: (diff: SchemaDiff) => string[]): TaggedDiff[] {
  return diffs.map(diff => tagDiff(diff, tagger(diff)));
}

export function buildTagIndex(tagged: TaggedDiff[]): TagIndex {
  const index: TagIndex = {};
  for (const { diff, tags } of tagged) {
    for (const tag of tags) {
      if (!index[tag]) index[tag] = [];
      index[tag].push(diff);
    }
  }
  return index;
}

export function filterByTag(tagged: TaggedDiff[], tag: string): SchemaDiff[] {
  const normalized = tag.toLowerCase().trim();
  return tagged
    .filter(t => t.tags.includes(normalized))
    .map(t => t.diff);
}

export function listTags(tagged: TaggedDiff[]): string[] {
  const set = new Set<string>();
  for (const { tags } of tagged) {
    for (const tag of tags) set.add(tag);
  }
  return Array.from(set).sort();
}

export function autoTag(diff: SchemaDiff): string[] {
  const tags: string[] = [diff.type];
  if (diff.path) {
    const parts = diff.path.split('.');
    if (parts.includes('properties')) tags.push('property');
    if (parts.includes('required')) tags.push('required');
    if (parts.includes('items')) tags.push('array');
  }
  if (diff.type === 'removed' || diff.type === 'changed') tags.push('breaking-candidate');
  return tags;
}

export function formatTagSummary(index: TagIndex): string {
  return Object.entries(index)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, diffs]) => `[${tag}] ${diffs.length} change(s)`)
    .join('\n');
}
