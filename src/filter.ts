import { SchemaDiff, ChangeType } from './types';

export interface FilterOptions {
  types?: ChangeType[];
  paths?: string[];
  breaking?: boolean;
  search?: string;
}

export function filterByType(diffs: SchemaDiff[], types: ChangeType[]): SchemaDiff[] {
  return diffs.filter((d) => types.includes(d.type));
}

export function filterByPath(diffs: SchemaDiff[], paths: string[]): SchemaDiff[] {
  return diffs.filter((d) =>
    paths.some((p) => d.path === p || d.path.startsWith(p + '.'))
  );
}

export function filterByBreaking(diffs: SchemaDiff[], breaking: boolean): SchemaDiff[] {
  const breakingTypes: ChangeType[] = ['type-change', 'property-removed', 'required-added'];
  return diffs.filter((d) => {
    const isBreaking = breakingTypes.includes(d.type);
    return breaking ? isBreaking : !isBreaking;
  });
}

export function filterBySearch(diffs: SchemaDiff[], search: string): SchemaDiff[] {
  const lower = search.toLowerCase();
  return diffs.filter(
    (d) =>
      d.path.toLowerCase().includes(lower) ||
      String(d.from ?? '').toLowerCase().includes(lower) ||
      String(d.to ?? '').toLowerCase().includes(lower)
  );
}

export function applyFilters(diffs: SchemaDiff[], options: FilterOptions): SchemaDiff[] {
  let result = [...diffs];

  if (options.types && options.types.length > 0) {
    result = filterByType(result, options.types);
  }

  if (options.paths && options.paths.length > 0) {
    result = filterByPath(result, options.paths);
  }

  if (options.breaking !== undefined) {
    result = filterByBreaking(result, options.breaking);
  }

  if (options.search) {
    result = filterBySearch(result, options.search);
  }

  return result;
}

export function groupByPath(diffs: SchemaDiff[]): Record<string, SchemaDiff[]> {
  return diffs.reduce<Record<string, SchemaDiff[]>>((acc, diff) => {
    const key = diff.path || '(root)';
    if (!acc[key]) acc[key] = [];
    acc[key].push(diff);
    return acc;
  }, {});
}
