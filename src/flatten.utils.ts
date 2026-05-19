import { FlatSchema } from './flatten';

export function groupByDepth(flat: FlatSchema[]): Record<number, FlatSchema[]> {
  const result: Record<number, FlatSchema[]> = {};
  for (const entry of flat) {
    const depth = entry.path === '(root)' ? 0 : entry.path.split('.').length;
    if (!result[depth]) result[depth] = [];
    result[depth].push(entry);
  }
  return result;
}

export function findByPath(flat: FlatSchema[], path: string): FlatSchema | undefined {
  return flat.find((f) => f.path === path);
}

export function getRequiredFields(flat: FlatSchema[]): FlatSchema[] {
  return flat.filter((f) => f.required);
}

export function getOptionalFields(flat: FlatSchema[]): FlatSchema[] {
  return flat.filter((f) => !f.required && f.path !== '(root)');
}

export function countByType(flat: FlatSchema[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of flat) {
    const types = Array.isArray(entry.type)
      ? entry.type
      : [entry.type ?? 'any'];
    for (const t of types) {
      counts[t] = (counts[t] ?? 0) + 1;
    }
  }
  return counts;
}

export function diffFlatSchemas(
  before: FlatSchema[],
  after: FlatSchema[]
): { added: FlatSchema[]; removed: FlatSchema[]; changed: FlatSchema[] } {
  const beforeMap = new Map(before.map((f) => [f.path, f]));
  const afterMap = new Map(after.map((f) => [f.path, f]));

  const added = after.filter((f) => !beforeMap.has(f.path));
  const removed = before.filter((f) => !afterMap.has(f.path));
  const changed = after.filter((f) => {
    const prev = beforeMap.get(f.path);
    return prev && JSON.stringify(prev) !== JSON.stringify(f);
  });

  return { added, removed, changed };
}
