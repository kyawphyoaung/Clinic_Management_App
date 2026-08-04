import type { NextAuthConfig } from "next-auth";

export const ADMIN_LOGIN_PATH = process.env.ADMIN_LOGIN_PATH ?? "jamesHarry";

function normalizeRoleToken(role: unknown): string | undefined {
  if (typeof role !== "string") return undefined;
  const upper = role.toUpperCase();
  if (upper === "ADMIN" || upper === "DOCTOR" || upper === "STAFF") return upper;
  return undefined;
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: `/${ADMIN_LOGIN_PATH}`,
  },
  session: {
    strategy: "jwt",
    // Throttle session cookie re-issue (helps avoid App Router refetch loops).
    updateAge: 24 * 60 * 60,
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = normalizeRoleToken((user as { role?: string }).role);
        token.sub = user.id;
      } else if (typeof token.role === "string") {
        const normalized = normalizeRoleToken(token.role);
        if (normalized && token.role !== normalized) {
          token.role = normalized;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = normalizeRoleToken(token.role);
      }
      return session;
    },
  },
};
