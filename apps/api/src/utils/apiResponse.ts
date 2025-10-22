import { z } from 'zod';

export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
});

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.any().optional(),
  }),
});

export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
};

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

export function apiError(message: string, code?: string, details?: any): ApiError {
  return { success: false, error: { message, code, details } };
}
