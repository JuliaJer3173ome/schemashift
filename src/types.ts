export type JSONSchemaType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

export interface JSONSchema {
  type?: JSONSchemaType | JSONSchemaType[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  additionalProperties?: boolean | JSONSchema;
  enum?: unknown[];
  const?: unknown;
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  title?: string;
  description?: string;
  default?: unknown;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  [key: string]: unknown;
}

export type DiffType = 'added' | 'removed' | 'changed';

export interface SchemaDiff {
  path: string;
  type: DiffType;
  from: unknown;
  to: unknown;
}

export interface MigrationStep {
  path: string;
  action: 'add' | 'remove' | 'update';
  breaking: boolean;
  description: string;
  before?: unknown;
  after?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PatchResult {
  schema: JSONSchema;
  applied: string[];
  skipped: string[];
}

export type OutputFormat = 'text' | 'markdown' | 'json';
