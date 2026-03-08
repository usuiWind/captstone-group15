import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

function withCors(res: NextResponse, origin: string | null) {
  if (origin && (origin === FRONTEND_ORIGIN || FRONTEND_ORIGIN === '*')) {
    const allowOrigin = FRONTEND_ORIGIN === '*' ? origin : FRONTEND_ORIGIN
    res.headers.set('Access-Control-Allow-Origin', allowOrigin)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }
  return res
}

export async function middleware(req: any) {
  const pathname = req.nextUrl.pathname
  const origin = req.headers.get('origin')

  // CORS preflight for API (SPA on different origin)
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const res = NextResponse.next()
    return withCors(res, origin)
  }

  // NextAuth API routes: always allow (session, csrf, signin, signout)
  if (pathname.startsWith('/api/auth')) {
    const res = NextResponse.next()
    return withCors(res, origin)
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAdmin = token?.role === 'ADMIN'

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

  // Public API routes (add CORS for SPA)
  if (
    pathname.startsWith('/api/staff') ||
    pathname.startsWith('/api/sponsors') ||
    pathname.startsWith('/api/contact')
  ) {
    const res = NextResponse.next()
    return withCors(res, origin)
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
