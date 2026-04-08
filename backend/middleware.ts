import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

function withCors(res: NextResponse, origin: string | null) {
  if (origin && origin === FRONTEND_ORIGIN) {
    res.headers.set('Access-Control-Allow-Origin', FRONTEND_ORIGIN)
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return res
}

export async function middleware(req: any) {
  const pathname = req.nextUrl.pathname
  const origin = req.headers.get('origin')

  // Handle CORS preflight for all API routes
  if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return withCors(new NextResponse(null, { status: 204 }), origin)
  }

  // Stripe webhooks bypass auth entirely
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  // All API routes get CORS headers (auth handled per-route)
  if (pathname.startsWith('/api/')) {
    const res = NextResponse.next()
    return withCors(res, origin)
  }

  // Page-level auth guards (for server-rendered pages, not the SPA)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isAdmin = token?.role === 'ADMIN'

  if (pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/membership')) && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
