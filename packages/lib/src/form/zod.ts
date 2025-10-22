import { z } from 'zod';
import { FormField } from '@nearbybazaar/types';

export function buildZodSchema(fields: FormField[]): z.ZodObject<any> {
  const shape: Record<string, any> = {};
  for (const field of fields) {
    let validator: any = z.any();
    switch (field.type) {
      case 'text':
        validator = z.string();
        if (field.required) validator = validator.min(1);
        break;
      case 'number':
        validator = z.number();
        if (field.required)
          validator = validator.refine((val) => val !== undefined && val !== null);
        break;
      case 'textarea':
        validator = z.string();
        if (field.required) validator = validator.min(1);
        break;
      case 'select':
      case 'radio':
        validator = z.string();
        if (field.options) validator = validator.refine((val) => field.options!.includes(val));
        if (field.required) validator = validator.min(1);
        break;
      case 'checkbox':
        validator = z.boolean();
        break;
      default:
        validator = z.any();
    }
    shape[field.id] = validator;
  }
  return z.object(shape);
}
