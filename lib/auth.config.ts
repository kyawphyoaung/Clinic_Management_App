import type { NextAuthConfig } from "next-auth";

export const ADMIN_LOGIN_PATH = process.env.ADMIN_LOGIN_PATH ?? "jamesHarry";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: `/${ADMIN_LOGIN_PATH}`,
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = "admin";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "admin";
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
