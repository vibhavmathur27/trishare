import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, expectedCookieValue, hashPassword } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = await expectedCookieValue();
  const given = await hashPassword(password || '');

  if (!process.env.SITE_PASSWORD || given !== expected) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, expected, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  return res;
}
