import type { Prisma } from "@/prisma/generated/prisma/client";

export function toInputJsonValue(
  value: Record<string, string | number>
): Prisma.InputJsonValue {
  return value;
}
