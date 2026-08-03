import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const publicRoutes = ['/', '/login', '/login-padre', '/register', '/forgot-password', '/blog', '/contacto', '/sobre-nosotros', '/terminos', '/privacidad', '/seguridad', '/pdpl', '/trabaja-con-nosotros']

const roleRouteMap: Record<string, string> = {
  super_admin: '/super-admin',
  director: '/director',
  secretario: '/secretario',
  docente: '/docente',
  padre: '/padre',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname === '/favicon.ico') {
    // Block API dev routes in production
    if (pathname.startsWith('/api/dev') && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // Block dev routes in production
  if (pathname.startsWith('/dev') && process.env.NODE_ENV === 'production') {
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
        if (expectedRoute) {
          return NextResponse.redirect(new URL(`${expectedRoute}/dashboard`, request.url))
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

    const isPanelRoute = Object.values(roleRouteMap).some(route => pathname.startsWith(route))

    if (isPanelRoute && expectedRoute && !pathname.startsWith(expectedRoute)) {
      return NextResponse.redirect(new URL(`${expectedRoute}/dashboard`, request.url))
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
