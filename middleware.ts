import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const publicRoutes = ['/', '/login', '/login-padre', '/register', '/forgot-password', '/blog', '/contacto', '/sobre-nosotros', '/terminos', '/privacidad', '/seguridad', '/pdpl', '/trabaja-con-nosotros']

const roleRouteMap: Record<string, string> = {
  super_admin: '/super-admin/dashboard',
  director: '/director/dashboard',
  secretario: '/secretario/dashboard',
  docente: '/docente/dashboard',
  padre: '/padre/dashboard',
  dev: '/dev',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    // Allow API dev routes for dev role in production, and director routes for director
    if (pathname.startsWith('/api/dev') && process.env.NODE_ENV === 'production') {
      const token = request.cookies.get('token')?.value
      if (token) {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
          const { payload } = await jwtVerify(token, secret)
          if (payload.role === 'dev' || payload.role === 'director') return NextResponse.next()
        } catch {}
      }
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // Allow dev routes for dev role in production
  if (pathname.startsWith('/dev') && process.env.NODE_ENV === 'production') {
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
        const { payload } = await jwtVerify(token, secret)
        if (payload.role === 'dev') return NextResponse.next()
      } catch {}
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/dev') || pathname.startsWith('/instituciones')) {
    return NextResponse.next()
  }

  const isPublicRoute = publicRoutes.some(route => pathname === route)

  if (isPublicRoute) {
    const token = request.cookies.get('token')?.value
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
        const { payload } = await jwtVerify(token, secret)
        const role = payload.role as string
        const expectedRoute = roleRouteMap[role]
        if (expectedRoute && expectedRoute !== '/') {
          return NextResponse.redirect(new URL(expectedRoute, request.url))
        }
      } catch {
        // token inválido, continuar como público
      }
    }
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'educonecta-secret')
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string
    const expectedRoute = roleRouteMap[role]

    const isPanelRoute = ['/super-admin', '/director', '/secretario', '/docente', '/padre', '/dev'].some(route => pathname.startsWith(route))
    const isOnOwnRoute = expectedRoute && pathname.startsWith(expectedRoute.split('/dashboard')[0])

    if (isPanelRoute && !isOnOwnRoute) {
      return NextResponse.redirect(new URL(expectedRoute, request.url))
    }

    return NextResponse.next()
  } catch {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)',
  ],
}
