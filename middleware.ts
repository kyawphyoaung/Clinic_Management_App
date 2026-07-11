import { auth } from "@/lib/auth";
import { ADMIN_LOGIN_PATH } from "@/lib/auth.config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const loginPath = `/${ADMIN_LOGIN_PATH}`;

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL(loginPath, req.nextUrl));
  }

  if (pathname === loginPath && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/jamesHarry"],
};
