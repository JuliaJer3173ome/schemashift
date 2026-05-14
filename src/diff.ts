import { JSONSchema7 } from "json-schema";

export type ChangeType =
  | "added"
  | "removed"
  | "changed"
  | "type_changed"
  | "required_added"
  | "required_removed";

export interface SchemaChange {
  path: string;
  type: ChangeType;
  before?: unknown;
  after?: unknown;
  description: string;
}

function buildPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

export function diffSchemas(
  before: JSONSchema7,
  after: JSONSchema7,
  basePath = ""
): SchemaChange[] {
  const changes: SchemaChange[] = [];

  const scalarKeys: (keyof JSONSchema7)[] = [
    "type",
    "title",
    "description",
    "format",
    "minimum",
    "maximum",
    "minLength",
    "maxLength",
    "pattern",
    "default",
    "enum",
  ];

  for (const key of scalarKeys) {
    const bVal = before[key];
    const aVal = after[key];
    if (JSON.stringify(bVal) !== JSON.stringify(aVal)) {
      const path = buildPath(basePath, key);
      if (bVal === undefined) {
        changes.push({ path, type: "added", after: aVal, description: `'${path}' was added with value ${JSON.stringify(aVal)}` });
      } else if (aVal === undefined) {
        changes.push({ path, type: "removed", before: bVal, description: `'${path}' was removed (was ${JSON.stringify(bVal)})` });
      } else {
        const changeType = key === "type" ? "type_changed" : "changed";
        changes.push({ path, type: changeType, before: bVal, after: aVal, description: `'${path}' changed from ${JSON.stringify(bVal)} to ${JSON.stringify(aVal)}` });
      }
    }
  }

  const beforeRequired = new Set(before.required ?? []);
  const afterRequired = new Set(after.required ?? []);

  for (const field of afterRequired) {
    if (!beforeRequired.has(field)) {
      const path = buildPath(basePath, `required[${field}]`);
      changes.push({ path, type: "required_added", after: field, description: `Field '${field}' is now required` });
    }
  }
  for (const field of beforeRequired) {
    if (!afterRequired.has(field)) {
      const path = buildPath(basePath, `required[${field}]`);
      changes.push({ path, type: "required_removed", before: field, description: `Field '${field}' is no longer required` });
    }
  }

  const beforeProps = before.properties ?? {};
  const afterProps = after.properties ?? {};
  const allPropKeys = new Set([...Object.keys(beforeProps), ...Object.keys(afterProps)]);

  for (const propKey of allPropKeys) {
    const propPath = buildPath(basePath, `properties.${propKey}`);
    const bProp = beforeProps[propKey];
    const aProp = afterProps[propKey];
    if (!bProp) {
      changes.push({ path: propPath, type: "added", after: aProp, description: `Property '${propPath}' was added` });
    } else if (!aProp) {
      changes.push({ path: propPath, type: "removed", before: bProp, description: `Property '${propPath}' was removed` });
    } else if (typeof bProp === "object" && typeof aProp === "object") {
      changes.push(...diffSchemas(bProp as JSONSchema7, aProp as JSONSchema7, propPath));
    }
  }

  return changes;
}
