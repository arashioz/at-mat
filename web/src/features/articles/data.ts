import 'server-only';
import { cache } from 'react';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Article, ArticleCardData, ArticlePhoto } from './types';
export const articleApi = process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api';
export const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002';
const media = (photo: ArticlePhoto | null) => photo ? { ...photo, url: `/media/${photo.key.split('/').map(encodeURIComponent).join('/')}` } : null;
async function request<T>(route: string): Promise<T | null> {
  const res = await fetch(`${articleApi}/public/articles${route}`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('مقالات فعلاً در دسترس نیستند. دوباره تلاش کنید.');
  return res.json() as Promise<T>;
}
export const getArticles = cache(async (): Promise<ArticleCardData[]> => {
  const items = await request<ArticleCardData[]>('') ?? [];
  return items.map(item => ({ ...item, cover: media(item.cover) }));
});
export const getArticle = cache(async (slug: string): Promise<Article | null> => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const item = await request<Article>(`/${encodeURIComponent(slug)}`);
  return item ? { ...item, cover: media(item.cover), bodyImage: media(item.bodyImage) } : null;
});
export const getArticleLogo = cache(async () => {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), '..', 'assets/image-manifest.json'), 'utf8')) as { images: { key: string; url: string; description?: string }[] };
  const entry = [...manifest.images].reverse().find(x => x.description === 'atmat-logo-fa');
  if (!entry?.key || !entry.url) throw new Error('لوگوی آپلودشده ات‌مت پیدا نشد');
  return `/media/${entry.key.split('/').map(encodeURIComponent).join('/')}`;
});
export const articleDate = (value: string) => new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(new Date(value));
