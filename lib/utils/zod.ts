import type { ZodError } from "zod";

export function getFirstZodError(
  error: ZodError,
  fallback = "Invalid data"
): string {
  return error.issues[0]?.message ?? fallback;
}
