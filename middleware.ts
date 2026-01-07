import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a public path
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // For client-side auth, we'll rely on the AuthProvider
  // This middleware just handles basic routing
  if (pathname === "/") {
    // Let the client handle the redirect based on auth state
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
