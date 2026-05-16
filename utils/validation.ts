// Validation utility (Zod wrapper)
import { z, ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(JSON.stringify(result.error.issues));
  }
  return result.data;
}
