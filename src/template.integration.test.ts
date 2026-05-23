import { createTemplate, rankTemplates, applyTemplate, matchTemplate } from './template';
import { diffSchemas } from './diff';

const baseUser = createTemplate('user-v1', 'User V1', {
  type: 'object',
  properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } },
  required: ['id', 'name'],
});

const extendedUser = createTemplate('user-v2', 'User V2', {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'name', 'email'],
});

describe('template + diff integration', () => {
  it('applies a template and diffs against another template', () => {
    const schemaA = applyTemplate(baseUser);
    const schemaB = applyTemplate(extendedUser);
    const diffs = diffSchemas(schemaA, schemaB);
    expect(diffs.length).toBeGreaterThan(0);
  });

  it('ranks templates against a partial schema and selects best', () => {
    const partial = {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' } },
    };
    const ranked = rankTemplates(partial, [extendedUser, baseUser]);
    expect(ranked[0].template.id).toBe('user-v1');
    expect(ranked[0].score).toBe(100);
  });

  it('shows missing fields when schema does not match template', () => {
    const minimal = { type: 'object', properties: { id: { type: 'string' } } };
    const match = matchTemplate(minimal, extendedUser);
    expect(match.missingFields).toContain('name');
    expect(match.missingFields).toContain('role');
    expect(match.score).toBeLessThan(50);
  });

  it('applies overrides on top of a template and diffs', () => {
    const schemaA = applyTemplate(baseUser);
    const schemaB = applyTemplate(baseUser, {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        nickname: { type: 'string' },
      },
    });
    const diffs = diffSchemas(schemaA, schemaB);
    expect(diffs.some((d) => d.path.includes('nickname'))).toBe(true);
  });
});
