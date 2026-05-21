import { JSONSchema, SchemaDiff } from './types';

/**
 * Fields that are considered sensitive and should be redacted by default.
 */
const DEFAULT_SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'authorization',
  'credential',
  'privateKey',
  'private_key',
]);

export type RedactOptions = {
  sensitiveKeys?: string[];
  replacement?: string;
  redactExamples?: boolean;
};

/**
 * Redacts sensitive field descriptions and examples from a JSON Schema.
 */
export function redactSchema(
  schema: JSONSchema,
  options: RedactOptions = {}
): JSONSchema {
  const {
    sensitiveKeys = [],
    replacement = '[REDACTED]',
    redactExamples = true,
  } = options;

  const sensitiveSet = new Set([
    ...DEFAULT_SENSITIVE_KEYS,
    ...sensitiveKeys.map((k) => k.toLowerCase()),
  ]);

  function redactNode(node: JSONSchema, key?: string): JSONSchema {
    if (typeof node !== 'object' || node === null) return node;

    const isSensitive = key && sensitiveSet.has(key.toLowerCase());
    const result: JSONSchema = { ...node };

    if (isSensitive) {
      if (result.description) result.description = replacement;
      if (redactExamples && result.examples) result.examples = [replacement];
      if (redactExamples && result.default !== undefined)
        result.default = replacement;
    }

    if (result.properties) {
      result.properties = Object.fromEntries(
        Object.entries(result.properties).map(([k, v]) => [
          k,
          redactNode(v as JSONSchema, k),
        ])
      );
    }

    if (result.items && typeof result.items === 'object') {
      result.items = redactNode(result.items as JSONSchema, key);
    }

    return result;
  }

  return redactNode(schema);
}

/**
 * Redacts sensitive path references from a list of schema diffs.
 */
export function redactDiffs(
  diffs: SchemaDiff[],
  options: RedactOptions = {}
): SchemaDiff[] {
  const { sensitiveKeys = [], replacement = '[REDACTED]' } = options;
  const sensitiveSet = new Set([
    ...DEFAULT_SENSITIVE_KEYS,
    ...sensitiveKeys.map((k) => k.toLowerCase()),
  ]);

  return diffs.map((diff) => {
    const pathParts = diff.path.split('.');
    const isSensitive = pathParts.some((part) =>
      sensitiveSet.has(part.toLowerCase())
    );
    if (!isSensitive) return diff;
    return {
      ...diff,
      before: diff.before !== undefined ? replacement : undefined,
      after: diff.after !== undefined ? replacement : undefined,
    };
  });
}
