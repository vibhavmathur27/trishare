import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, expectedCookieValue } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow the login page itself and its API route through.
  if (pathname === '/login' || pathname === '/api/login') {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const expected = await expectedCookieValue();

  if (cookie && expected && cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Protect everything except Next's internal static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
