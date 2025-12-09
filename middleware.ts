import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/schedule",
  "/patients",
  "/medical-records",
  "/financial",
  "/communications",
  "/reports",
  "/settings",
];

// Routes for patients only
const patientRoutes = [
  "/portal",
  "/portal/sessions",
  "/portal/diary",
  "/portal/exercises",
  "/portal/resources",
  "/portal/settings",
  "/portal/financial",
  "/portal/chat",
  "/portal/quiz",
];

// Routes that are public (no auth required)
const publicRoutes = ["/", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPatientRoute = patientRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = publicRoutes.includes(pathname);

  // Get token from cookie or check localStorage on client side
  // Note: In production, use httpOnly cookies for better security
  const token = request.cookies.get("auth_token")?.value;

  // If trying to access protected route without token
  if ((isProtectedRoute || isPatientRoute) && !token) {
    // For now, allow access (token is in localStorage, not cookies)
    // In future, implement proper cookie-based auth
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
