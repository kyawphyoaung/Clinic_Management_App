import type { UserRole } from "@/prisma/generated/prisma/client";

export function normalizeRole(
  role: string | undefined | null
): UserRole | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (upper === "ADMIN" || upper === "DOCTOR" || upper === "STAFF") {
    return upper as UserRole;
  }
  return null;
}
