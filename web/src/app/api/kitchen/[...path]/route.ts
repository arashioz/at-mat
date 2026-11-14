import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const cookieName = 'atmat_kitchen';
const methods: [RegExp, string[]][] = [
  [/^session$/, ['GET', 'POST']], [/^(register|login|logout)$/, ['POST']],
  [/^conversations$/, ['GET']], [/^conversations\/[a-f0-9-]{36}$/, ['GET', 'PUT']],
  [/^conversations\/[a-f0-9-]{36}\/messages$/, ['POST']],
  [/^saved$/, ['GET', 'POST']], [/^saved\/[a-f0-9]{24}$/, ['DELETE']],
];
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = (await context.params).path.join('/');
  if (!methods.some(([pattern, allowed]) => pattern.test(path) && allowed.includes(request.method))) return NextResponse.json({ message: 'مسیر پیدا نشد.' }, { status: 404 });
  // Only the first-party site can mutate a cookie-authenticated kitchen session.
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (origin !== request.nextUrl.origin || request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ message: 'مبدأ درخواست معتبر نیست.' }, { status: 403 });
  }
  const api = (process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api').replace(/\/+$/, '');
  const token = request.cookies.get(cookieName)?.value;
  try {
    let body: string | undefined;
    if (['POST', 'PUT'].includes(request.method)) {
      if (Number(request.headers.get('content-length') ?? 0) > 12000) return NextResponse.json({ message: 'پیام بیش از حد بلند است.' }, { status: 413 });
      body = await request.text();
      if (Buffer.byteLength(body) > 12000) return NextResponse.json({ message: 'پیام بیش از حد بلند است.' }, { status: 413 });
    }
    const upstream = await fetch(`${api}/public/kitchen/${path}`, {
      method: request.method, cache: 'no-store', signal: AbortSignal.timeout(40000),
      headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body,
    });
    const data = await upstream.json();
    const newToken = data.token;
    delete data.token;
    const response = NextResponse.json(data, { status: upstream.status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
    if (upstream.ok && typeof newToken === 'string') response.cookies.set(cookieName, newToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 86400,
    });
    if (path === 'logout' && upstream.ok) response.cookies.delete(cookieName);
    return response;
  } catch {
    return NextResponse.json({ message: 'ارتباط با آشپزخانه برقرار نشد. دوباره تلاش کن.' }, { status: 503 });
  }
}
export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE };
