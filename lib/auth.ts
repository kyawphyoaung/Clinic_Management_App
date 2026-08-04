import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/db";

async function ensureBootstrapAdmin() {
  const count = await prisma.user.count();
  if (count > 0) return;

  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      fullName: "Administrator",
      role: "ADMIN",
      email: null,
    },
  });
}

async function resolveLegacyAdminTokenSub(sub: string | undefined) {
  if (sub !== "admin") return null;
  await ensureBootstrapAdmin();
  const username = process.env.ADMIN_USERNAME;
  if (!username) return null;
  return prisma.user.findUnique({
    where: { username },
    select: { id: true, role: true },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role?.toUpperCase();
        token.sub = user.id;
      } else if (typeof token.role === "string") {
        const upper = token.role.toUpperCase();
        // Only mutate when needed — avoid marking the JWT dirty every request.
        if (token.role !== upper) {
          token.role = upper;
        }
      }

      // Migrate pre-RBAC sessions that still use id "admin"
      if (token.sub === "admin") {
        const legacy = await resolveLegacyAdminTokenSub(token.sub);
        if (legacy) {
          token.sub = legacy.id;
          token.role = legacy.role;
        }
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;

        await ensureBootstrapAdmin();

        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.fullName,
          email: user.email ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
});
