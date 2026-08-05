import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/blog', '/contacto', '/sobre-nosotros', '/terminos', '/privacidad', '/seguridad', '/pdpl', '/trabaja-con-nosotros']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname === route)

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const roleRouteMap: Record<string, string> = {
      'super_admin': '/super-admin',
      'director': '/director',
      'secretario': '/secretario',
      'docente': '/docente',
      'padre': '/padre'
    }

    const pathname = request.nextUrl.pathname
    const isPanelRoute = Object.values(roleRouteMap).some(route => pathname.startsWith(route))

    if (isPanelRoute && userRole?.role) {
      const expectedRoute = roleRouteMap[userRole.role]
      if (expectedRoute && !pathname.startsWith(expectedRoute)) {
        const url = request.nextUrl.clone()
        url.pathname = expectedRoute
        return NextResponse.redirect(url)
      }
    }

    if (!isPublicRoute && !isPanelRoute && userRole?.role) {
      const url = request.nextUrl.clone()
      url.pathname = roleRouteMap[userRole.role] || '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
