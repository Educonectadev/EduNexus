import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const publicRoutes = ['/', '/login', '/login-padre', '/register', '/demo', '/demo/', '/forgot-password', '/blog', '/contacto', '/sobre-nosotros', '/terminos', '/privacidad', '/seguridad', '/pdpl', '/trabaja-con-nosotros']

const roleRouteMap: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  director: '/director/dashboard',
  secretario: '/secretario/dashboard',
  docente: '/docente/dashboard',
  padre: '/padre/dashboard',
  dev: '/dev',
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7)
  return request.cookies.get('token')?.value || null
}

async function verifyRole(token: string): Promise<string | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    return (payload.role as string) || null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  // API routes: check Authorization header first, cookie as fallback
  if (pathname.startsWith('/api')) {
    if (pathname.startsWith('/api/dev') && process.env.NODE_ENV === 'production') {
      const token = extractToken(request)
      if (token) {
        const role = await verifyRole(token)
        if (role === 'dev' || role === 'director') return NextResponse.next()
      }
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // Allow dev routes for dev role in production
  if (pathname.startsWith('/dev') && process.env.NODE_ENV === 'production') {
    const token = extractToken(request)
    if (token) {
      const role = await verifyRole(token)
      if (role === 'dev') return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/dev') || pathname.startsWith('/instituciones')) {
    return NextResponse.next()
  }

  const isPublicRoute = publicRoutes.some(route => pathname === route)

  if (isPublicRoute) {
    const token = extractToken(request)
    if (token) {
      const role = await verifyRole(token)
      if (role) {
        const expectedRoute = roleRouteMap[role]
        if (expectedRoute && expectedRoute !== '/') {
          return NextResponse.redirect(new URL(expectedRoute, request.url))
        }
      }
    }
    return NextResponse.next()
  }

  const token = extractToken(request)

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = await verifyRole(token)

  if (!role) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
    return response
  }

  const expectedRoute = roleRouteMap[role]
  const isPanelRoute = ['/super-admin', '/director', '/secretario', '/docente', '/padre', '/dev'].some(route => pathname.startsWith(route))
  const isOnOwnRoute = expectedRoute && pathname.startsWith(expectedRoute.split('/dashboard')[0])

  if (isPanelRoute && !isOnOwnRoute) {
    return NextResponse.redirect(new URL(expectedRoute, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
