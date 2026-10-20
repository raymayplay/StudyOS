import { NextResponse, type NextRequest } from "next/server";

import { isAuthConfigured, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-crypto";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth/")) return NextResponse.next();

  if (!isAuthConfigured()) {
    if (pathname === "/setup") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (pathname === "/setup") return NextResponse.redirect(new URL("/login", request.url));
  const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (authenticated) {
    if (pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (pathname === "/login") return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in to use StudyOS." }, { status: 401 });
  }
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)"],
};
