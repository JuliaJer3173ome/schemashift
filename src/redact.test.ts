import { redactSchema, redactDiffs } from './redact';
import { SchemaDiff } from './types';

describe('redactSchema', () => {
  it('redacts description of sensitive fields', () => {
    const schema = {
      type: 'object',
      properties: {
        password: { type: 'string', description: 'User password' },
        username: { type: 'string', description: 'User name' },
      },
    };
    const result = redactSchema(schema);
    expect(result.properties!['password'].description).toBe('[REDACTED]');
    expect(result.properties!['username'].description).toBe('User name');
  });

  it('redacts examples and defaults for sensitive fields', () => {
    const schema = {
      type: 'object',
      properties: {
        token: { type: 'string', examples: ['abc123'], default: 'tok' },
      },
    };
    const result = redactSchema(schema);
    expect(result.properties!['token'].examples).toEqual(['[REDACTED]']);
    expect(result.properties!['token'].default).toBe('[REDACTED]');
  });

  it('does not redact examples when redactExamples is false', () => {
    const schema = {
      type: 'object',
      properties: {
        secret: { type: 'string', examples: ['mysecret'] },
      },
    };
    const result = redactSchema(schema, { redactExamples: false });
    expect(result.properties!['secret'].examples).toEqual(['mysecret']);
  });

  it('supports custom sensitive keys', () => {
    const schema = {
      type: 'object',
      properties: {
        ssn: { type: 'string', description: 'Social security number' },
      },
    };
    const result = redactSchema(schema, { sensitiveKeys: ['ssn'] });
    expect(result.properties!['ssn'].description).toBe('[REDACTED]');
  });

  it('supports custom replacement string', () => {
    const schema = {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'API key value' },
      },
    };
    const result = redactSchema(schema, { replacement: '***' });
    expect(result.properties!['apiKey'].description).toBe('***');
  });

  it('does not mutate the original schema', () => {
    const schema = {
      type: 'object',
      properties: {
        password: { type: 'string', description: 'secret' },
      },
    };
    redactSchema(schema);
    expect(schema.properties!['password'].description).toBe('secret');
  });
});

describe('redactDiffs', () => {
  const diffs: SchemaDiff[] = [
    { path: 'properties.password', type: 'changed', before: 'oldpass', after: 'newpass' },
    { path: 'properties.username', type: 'changed', before: 'alice', after: 'bob' },
  ];

  it('redacts before/after values for sensitive paths', () => {
    const result = redactDiffs(diffs);
    expect(result[0].before).toBe('[REDACTED]');
    expect(result[0].after).toBe('[REDACTED]');
  });

  it('leaves non-sensitive paths unchanged', () => {
    const result = redactDiffs(diffs);
    expect(result[1].before).toBe('alice');
    expect(result[1].after).toBe('bob');
  });

  it('supports custom sensitive keys in diffs', () => {
    const customDiffs: SchemaDiff[] = [
      { path: 'properties.ssn', type: 'changed', before: '123', after: '456' },
    ];
    const result = redactDiffs(customDiffs, { sensitiveKeys: ['ssn'] });
    expect(result[0].before).toBe('[REDACTED]');
  });
});
