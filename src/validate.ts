import { JSONSchema, SchemaDiff } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateSchema(schema: JSONSchema): ValidationResult {
  const errors: string[] = [];

  if (typeof schema !== 'object' || schema === null) {
    return { valid: false, errors: ['Schema must be a non-null object'] };
  }

  if (schema.type !== undefined) {
    const validTypes = ['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'];
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    for (const t of types) {
      if (!validTypes.includes(t as string)) {
        errors.push(`Invalid type: "${t}". Must be one of: ${validTypes.join(', ')}`);
      }
    }
  }

  if (schema.properties !== undefined) {
    if (typeof schema.properties !== 'object' || schema.properties === null) {
      errors.push('"properties" must be an object');
    } else {
      for (const [key, value] of Object.entries(schema.properties)) {
        const nested = validateSchema(value as JSONSchema);
        if (!nested.valid) {
          nested.errors.forEach(e => errors.push(`properties.${key}: ${e}`));
        }
      }
    }
  }

  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required)) {
      errors.push('"required" must be an array');
    } else {
      schema.required.forEach((r, i) => {
        if (typeof r !== 'string') {
          errors.push(`"required[${i}]" must be a string`);
        }
      });
    }
  }

  if (schema.minimum !== undefined && typeof schema.minimum !== 'number') {
    errors.push('"minimum" must be a number');
  }

  if (schema.maximum !== undefined && typeof schema.maximum !== 'number') {
    errors.push('"maximum" must be a number');
  }

  if (
    schema.minimum !== undefined &&
    schema.maximum !== undefined &&
    (schema.minimum as number) > (schema.maximum as number)
  ) {
    errors.push('"minimum" must be less than or equal to "maximum"');
  }

  if (schema.minLength !== undefined && typeof schema.minLength !== 'number') {
    errors.push('"minLength" must be a number');
  }

  if (schema.maxLength !== undefined && typeof schema.maxLength !== 'number') {
    errors.push('"maxLength" must be a number');
  }

  if (schema.items !== undefined && typeof schema.items === 'object' && schema.items !== null) {
    const nested = validateSchema(schema.items as JSONSchema);
    if (!nested.valid) {
      nested.errors.forEach(e => errors.push(`items: ${e}`));
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateDiffSchemas(
  sourceSchema: JSONSchema,
  targetSchema: JSONSchema
): { source: ValidationResult; target: ValidationResult; canDiff: boolean } {
  const source = validateSchema(sourceSchema);
  const target = validateSchema(targetSchema);
  return {
    source,
    target,
    canDiff: source.valid && target.valid,
  };
}
