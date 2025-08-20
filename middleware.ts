import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard", "/employees", "/clients", "/invoices", "/devis", "/meter-work"]
const publicRoutes = ["/login", "/"] // Assuming '/' is also public or redirects to login if not authenticated

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  // Allow API routes related to authentication to pass through
  if (path.startsWith("/api/auth")) {
    console.log("Allowing auth API route")
    return NextResponse.next()
  }

  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
  const isPublicRoute = publicRoutes.includes(path)

  const token = cookies().get("token")?.value
  console.log("Middleware called for:", path)
  console.log("Token found:", !!token)

  // If it's a protected route and no token is found, redirect to login
  if (isProtectedRoute && !token) {
    console.log("Redirecting to login - no token for protected route")
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // If it's a public route (excluding login itself) and a token is found, redirect to dashboard
  // This prevents authenticated users from seeing the login/home page again
  if (isPublicRoute && token && path !== "/login") {
    console.log("Redirecting to dashboard - authenticated user on public route")
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
}
