import {
  createTemplate,
  matchTemplate,
  rankTemplates,
  applyTemplate,
  formatTemplateMatch,
} from './template';

const userTemplate = createTemplate(
  'user',
  'User Schema',
  {
    type: 'object',
    properties: { id: {}, name: {}, email: {} },
  },
  { description: 'Standard user schema', tags: ['user', 'auth'] }
);

const productTemplate = createTemplate('product', 'Product Schema', {
  type: 'object',
  properties: { id: {}, title: {}, price: {}, sku: {} },
});

describe('createTemplate', () => {
  it('creates a template with required fields', () => {
    expect(userTemplate.id).toBe('user');
    expect(userTemplate.name).toBe('User Schema');
    expect(userTemplate.tags).toContain('auth');
  });

  it('defaults description and tags', () => {
    const t = createTemplate('t', 'T', {});
    expect(t.description).toBe('');
    expect(t.tags).toEqual([]);
  });
});

describe('matchTemplate', () => {
  it('returns 100% score for exact property match', () => {
    const schema = { type: 'object', properties: { id: {}, name: {}, email: {} } };
    const result = matchTemplate(schema, userTemplate);
    expect(result.score).toBe(100);
    expect(result.missingFields).toHaveLength(0);
    expect(result.extraFields).toHaveLength(0);
  });

  it('detects missing and extra fields', () => {
    const schema = { type: 'object', properties: { id: {}, name: {}, phone: {} } };
    const result = matchTemplate(schema, userTemplate);
    expect(result.missingFields).toContain('email');
    expect(result.extraFields).toContain('phone');
    expect(result.score).toBeLessThan(100);
  });

  it('handles schema with no properties', () => {
    const result = matchTemplate({}, userTemplate);
    expect(result.score).toBe(0);
    expect(result.missingFields).toHaveLength(3);
  });
});

describe('rankTemplates', () => {
  it('ranks best matching template first', () => {
    const schema = { type: 'object', properties: { id: {}, name: {}, email: {} } };
    const ranked = rankTemplates(schema, [productTemplate, userTemplate]);
    expect(ranked[0].template.id).toBe('user');
  });
});

describe('applyTemplate', () => {
  it('returns template schema with overrides', () => {
    const result = applyTemplate(userTemplate, { title: 'My Schema' });
    expect(result.title).toBe('My Schema');
    expect(result.type).toBe('object');
  });
});

describe('formatTemplateMatch', () => {
  it('includes template name and score', () => {
    const schema = { type: 'object', properties: { id: {}, name: {} } };
    const match = matchTemplate(schema, userTemplate);
    const output = formatTemplateMatch(match);
    expect(output).toContain('User Schema');
    expect(output).toContain('Missing fields');
  });
});
