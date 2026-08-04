import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_LOGIN_PATH } from "@/lib/auth.config";
import { normalizeRole } from "@/lib/roles";

/**
 * Read-only auth gate. Do NOT use NextAuth's `auth()` wrapper here —
 * it re-encodes the JWT cookie on every request, which invalidates the
 * App Router client cache and causes an infinite /dashboard RSC refetch loop.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const loginPath = `/${ADMIN_LOGIN_PATH}`;

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const role = normalizeRole(
    typeof token?.role === "string" ? token.role : null
  );

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL(loginPath, req.nextUrl));
  }

  if (pathname === loginPath && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isLoggedIn && role && role !== "ADMIN") {
    if (
      pathname.startsWith("/dashboard/agents") ||
      pathname.startsWith("/dashboard/agent_billing") ||
      pathname.startsWith("/dashboard/commission") ||
      pathname.startsWith("/dashboard/settings") ||
      pathname.startsWith("/dashboard/clinics")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/jamesHarry"],
};
