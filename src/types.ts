export type JsonSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface JsonSchema {
  type?: JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  const?: unknown;
  description?: string;
  title?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  additionalProperties?: boolean | JsonSchema;
  $ref?: string;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  [key: string]: unknown;
}

export type DiffType = 'added' | 'removed' | 'changed' | 'type_changed';

export interface SchemaDiff {
  type: DiffType;
  path: string;
  value?: unknown;
  oldValue?: unknown;
  description?: string;
}

export interface MigrationStep {
  operation: 'add' | 'remove' | 'replace' | 'rename';
  path: string;
  value?: unknown;
  fromPath?: string;
  description: string;
}

export interface SchemaShiftResult {
  diffs: SchemaDiff[];
  migrations: MigrationStep[];
  report: string;
  hasBreakingChanges: boolean;
}
