import { buildZodSchema } from '../src/form/zod';

describe('Form Zod Schema Generation', () => {
  it('validates required text field', () => {
    const fields = [{ id: 'name', type: 'text', required: true }];
    const schema = buildZodSchema(fields);
    expect(() => schema.parse({ name: '' })).toThrow();
    expect(schema.parse({ name: 'John' })).toBeTruthy();
  });

  it('validates select options', () => {
    const fields = [{ id: 'color', type: 'select', options: ['red', 'blue'], required: true }];
    const schema = buildZodSchema(fields);
    expect(() => schema.parse({ color: 'green' })).toThrow();
    expect(schema.parse({ color: 'red' })).toBeTruthy();
  });
});
