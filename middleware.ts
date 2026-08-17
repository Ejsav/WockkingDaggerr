import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";

// ============================================================
// EDGE AUTHORIZATION
// The control room is gated here, before Next.js renders any
// admin markup or runs any admin route handler. A direct URL
// hit, a hard refresh, and a client-side navigation all pass
// through this same check — there is no first paint of admin
// content for an unauthenticated visitor.
// ============================================================

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The sign-in page and the sign-in endpoint must stay reachable.
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const authorized = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (authorized) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}
