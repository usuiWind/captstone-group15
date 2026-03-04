import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: any) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAdmin = token?.role === 'ADMIN'
  const pathname = req.nextUrl.pathname

  // Admin routes protection
  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/about',
    '/staff',
    '/sponsors',
    '/pricing',
    '/contact',
    '/login',
    '/register',
    '/api/webhooks',
    '/api/staff',
    '/api/sponsors'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Webhook routes bypass auth entirely
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // Public API routes
  if (pathname.startsWith('/api/staff') || pathname.startsWith('/api/sponsors')) {
    return NextResponse.next()
  }

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Protected routes require authentication
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/membership') ||
      pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
