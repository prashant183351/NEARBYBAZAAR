import { buildZodSchema } from '../src/form/zod';
// import { FormFieldType } from '@nearbybazaar/types';

describe('Form Zod Schema Generation', () => {
  it('validates required text field', () => {
    const fields: import('@nearbybazaar/types').FormField[] = [
      { id: 'name', type: 'text', label: 'Name', required: true },
    ];
    const schema = buildZodSchema(fields);
    expect(() => schema.parse({ name: '' })).toThrow();
    expect(schema.parse({ name: 'John' })).toBeTruthy();
  });

  it('validates select options', () => {
    const fields: import('@nearbybazaar/types').FormField[] = [
      { id: 'color', type: 'select', label: 'Color', options: ['red', 'blue'], required: true },
    ];
    const schema = buildZodSchema(fields);
    expect(() => schema.parse({ color: 'green' })).toThrow();
    expect(schema.parse({ color: 'red' })).toBeTruthy();
  });
});
