import { createClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip internal Next.js requests
  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  const { supabase, response } = await createClient(request)
  const { data: { user } } = await supabase.auth.getUser()

  // Auth pages: redirect to home if already logged in
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Protected pages: redirect to login if not authenticated
  const isPublicPath =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/auth/')

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
