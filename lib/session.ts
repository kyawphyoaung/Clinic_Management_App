import { cookies } from "next/headers";
import { getToken } from "next-auth/jwt";
import type { Session } from "next-auth";
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
 * Decode the JWT from cookies without going through Auth.js `auth()` /
 * `/api/auth/session`. Those paths re-sign and Set-Cookie on every call
 * (JWT strategy has no updateAge throttle), which invalidates the App Router
 * client cache and causes an infinite RSC refetch loop.
 */
async function readJwtToken() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: process.env.AUTH_SECRET,
  });
}

/**
 * Optional session for `SessionProvider`'s `session` prop so the client does
 * not call `/api/auth/session` on mount (which would Set-Cookie and loop).
 */
export async function getOptionalAuthSession(): Promise<Session | null> {
  const token = await readJwtToken();
  if (!token?.sub) return null;

  const expiresMs =
    typeof token.exp === "number" ? token.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;

  return {
    user: {
      id: token.sub,
      name: typeof token.name === "string" ? token.name : null,
      email: typeof token.email === "string" ? token.email : null,
      role:
        normalizeRole(typeof token.role === "string" ? token.role : null) ??
        undefined,
    },
    expires: new Date(expiresMs).toISOString(),
  };
}

/**
 * Read-only session check. Prefer this over `auth()` in Server Components /
 * actions — Auth.js JWT `auth()` re-issues the session cookie on every call,
 * which triggers an App Router RSC refetch loop.
 */
export async function requireAuth(): Promise<AppSession> {
  const token = await readJwtToken();

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
