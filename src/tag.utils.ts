import { TaggedDiff, TagIndex } from './tag';

export function mergeTags(a: TaggedDiff, extraTags: string[]): TaggedDiff {
  const merged = Array.from(new Set([...a.tags, ...extraTags.map(t => t.toLowerCase().trim())]));
  return { diff: a.diff, tags: merged };
}

export function removeTags(tagged: TaggedDiff, toRemove: string[]): TaggedDiff {
  const remove = new Set(toRemove.map(t => t.toLowerCase().trim()));
  return { diff: tagged.diff, tags: tagged.tags.filter(t => !remove.has(t)) };
}

export function intersectTags(tagged: TaggedDiff[], tags: string[]): TaggedDiff[] {
  const required = tags.map(t => t.toLowerCase().trim());
  return tagged.filter(t => required.every(r => t.tags.includes(r)));
}

export function countByTag(index: TagIndex): Record<string, number> {
  return Object.fromEntries(
    Object.entries(index).map(([tag, diffs]) => [tag, diffs.length])
  );
}

export function topTags(index: TagIndex, n = 5): string[] {
  return Object.entries(index)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, n)
    .map(([tag]) => tag);
}

export function tagIndexToJson(index: TagIndex): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(index).map(([tag, diffs]) => [tag, diffs.length])
    ),
    null,
    2
  );
}
