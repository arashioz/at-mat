import { isEditorialImageKey, isRasterType } from '../../../lib/media';

const mediaOrigin = (process.env.ATMAT_MEDIA_URL ?? 'http://127.0.0.1:9000/at-mat-assets').replace(/\/+$/, '');

export async function GET(_request: Request, { params }: { params: { key: string[] } }) {
  const key = params.key.join('/');
  if (params.key.length !== 2 || !isEditorialImageKey(key)) return new Response(null, { status: 404 });
  try {
    const upstream = await fetch(`${mediaOrigin}/${params.key.map(encodeURIComponent).join('/')}`, {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(6000),
    });
    const type = upstream.headers.get('content-type')?.split(';')[0].trim() ?? '';
    if (!upstream.ok || !upstream.body || !isRasterType(type)) {
      await upstream.body?.cancel();
      return new Response(null, { status: upstream.status >= 500 ? 502 : 404 });
    }
    return new Response(upstream.body, { headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=1800',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
