import { readFile } from 'node:fs/promises';

const api = (process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api').replace(/\/$/, '');
const site = process.env.ATMAT_SITE_URL ?? 'http://127.0.0.1:3002';
const admin = process.env.ATMAT_ADMIN_URL ?? 'http://127.0.0.1:3001';
let checks = 0;
const renderedPages = [];

async function check(base, route, { status = 200, json = false, method = 'GET', contentType } = {}) {
  const response = await fetch(new URL(route, `${base}/`), {
    method, signal: AbortSignal.timeout(30000), redirect: 'follow',
  });
  if (response.status !== status) throw new Error(`${route}: expected ${status}, received ${response.status}`);
  if (contentType && !response.headers.get('content-type')?.startsWith(contentType)) {
    throw new Error(`${route}: storage proxy did not return ${contentType}`);
  }
  const body = json ? await response.json() : await response.text();
  if (base === site && method === 'GET' && typeof body === 'string') renderedPages.push(body);
  checks++;
  return body;
}

try {
  await check(api, 'health');
  const articles = await check(api, 'public/articles', { json: true });
  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error('No published articles: restore the MongoDB backup or run npm run seed:articles after restoring assets.');
  }
  await check(api, 'articles', { status: 401 });
  await check(api, 'recipes', { status: 401 });
  await check(api, 'collaboration', { status: 401 });
  const recipes = await check(api, 'public/recipes', { json: true });
  if (!Array.isArray(recipes)) throw new Error('The public recipe catalog is not an array.');
  await check(admin, '/api/health');
  await check(admin, '/api/articles', { status: 401 });
  await check(admin, '/api/recipes', { status: 401 });
  await check(admin, '/api/collaboration', { status: 401 });
  for (const route of ['/login', '/articles', '/recipes', '/library', '/collaboration']) await check(admin, route);
  for (const route of ['/', '/recipes', '/articles', '/about', '/collaboration', ...['brine', 'sunflower', 'olive-oil', 'pepper', 'smoked', 'dill'].map(slug => `/flavors/${slug}`)]) {
    await check(site, route);
  }
  await check(site, '/media/branding/atmat-home-coast.mp4', { method: 'HEAD', contentType: 'video/mp4' });
  for (const recipe of recipes) await check(site, `/recipes/${recipe.slug}`);
  for (const article of articles) {
    await check(api, `public/articles/${article.slug}`, { json: true });
    await check(site, `/articles/${article.slug}`);
  }
  const manifest = JSON.parse(await readFile(new URL('../assets/image-manifest.json', import.meta.url), 'utf8'));
  const logo = manifest.images.findLast(entry => entry.description === 'atmat-logo-fa');
  if (!logo) throw new Error('The uploaded Persian logo is missing from the manifest.');
  await check(admin, `/media/${logo.key.split('/').map(encodeURIComponent).join('/')}`, { method: 'HEAD', contentType: 'image/' });
  const missingUnused = [];
  let requiredImages = 0;
  for (const { key } of manifest.images) {
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    const used = renderedPages.some(html => html.includes(`/media/${encodedKey}`));
    if (used) requiredImages++;
    try {
      await check(site, `/media/${encodedKey}`, { method: 'HEAD', contentType: 'image/' });
    } catch (error) {
      if (used) throw error;
      missingUnused.push(key);
    }
  }
  if (!requiredImages) throw new Error('No manifest images were found in the rendered pages.');
  console.log(`Integration passed: ${checks} checks covering API, admin proxy, all content pages and ${requiredImages} referenced images.`);
  if (missingUnused.length) {
    console.warn(`${missingUnused.length} older manifest entries are unavailable and are not referenced by current site pages:`);
    missingUnused.forEach(key => console.warn(`  ${key}`));
    console.warn('Review these entries through the storage API before preparing the separate asset backup.');
  }
} catch (error) {
  console.error(`Integration failed: ${error.message}`);
  process.exitCode = 1;
}
