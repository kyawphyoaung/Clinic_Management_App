import type { UserRole } from "@/prisma/generated/prisma/client";
import { requireAuth } from "@/lib/session";
import { normalizeRole } from "@/lib/roles";

export type Permission =
  | "*"
  | "patients:read"
  | "patients:write"
  | "patients:delete"
  | "treatments:read"
  | "treatments:write"
  | "agents:read"
  | "agents:write"
  | "users:manage"
  | "clinics:manage"
  | "appointments:read"
  | "appointments:write"
  | "availability:manage"
  | "catalog:manage";

export { normalizeRole };

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ["*"],
  DOCTOR: [
    "patients:read",
    "patients:write",
    "treatments:read",
    "treatments:write",
    "appointments:read",
    "appointments:write",
    "availability:manage",
  ],
  STAFF: [
    "patients:read",
    "patients:write",
    "treatments:read",
    "appointments:read",
    "appointments:write",
    "availability:manage",
    "catalog:manage",
  ],
};

export function hasPermission(
  role: string | undefined | null,
  permission: Permission
): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  const perms = ROLE_PERMISSIONS[normalized];
  return perms.includes("*") || perms.includes(permission);
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  const role = session.user.role;
  if (!hasPermission(role, permission)) {
    throw new Error("Forbidden");
  }
  return session;
}

export function canAccessAgents(role: string | undefined | null) {
  return hasPermission(role, "agents:read");
}

export function canManageUsers(role: string | undefined | null) {
  return hasPermission(role, "users:manage");
}

export function canWriteTreatments(role: string | undefined | null) {
  return hasPermission(role, "treatments:write");
}
