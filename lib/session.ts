import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import { normalizeRole } from "@/lib/roles";
import type { UserRole } from "@/prisma/generated/prisma/client";

export type AppSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: UserRole;
  };
};

/**
 * Read-only session check. Prefer this over `auth()` in Server Components /
 * actions — Auth.js JWT `auth()` re-issues the session cookie on every call,
 * which triggers an App Router RSC refetch loop.
 */
export async function requireAuth(): Promise<AppSession> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const token = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.sub) {
    throw new Error("Unauthorized");
  }

  return {
    user: {
      id: token.sub,
      name: typeof token.name === "string" ? token.name : null,
      email: typeof token.email === "string" ? token.email : null,
      role:
        normalizeRole(typeof token.role === "string" ? token.role : null) ??
        undefined,
    },
  };
}
