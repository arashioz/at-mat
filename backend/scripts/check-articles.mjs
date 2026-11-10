import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const api = process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api';
let token;
const send = async (path, method = 'GET', body, auth = true) => {
 const res = await fetch(api + path, { method, headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
 return { status: res.status, data: await res.json() };
};
const login = await send('/auth/login', 'POST', { identifier: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }, false);
assert.equal(login.status, 200); token = login.data.accessToken;
assert.equal((await send('/articles', 'GET', undefined, false)).status, 401);
const seeds = JSON.parse(await readFile(new URL('../seeds/articles.json', import.meta.url)));
const list = (await send('/public/articles')).data;
const recipes = JSON.parse(await readFile(new URL('../../web/src/features/recipes/content.json', import.meta.url)));
for (const { slug } of seeds) {
 const a = list.find(item => item.slug === slug);
 assert(a, `Missing published seed: ${slug}`);
 assert(a.wordCount >= 700 && a.wordCount <= 1500); assert(a.cover?.url && a.cover?.alt);
 const detail = (await send('/public/articles/' + a.slug)).data; assert(detail.bodyImage?.url && detail.sources.length);
 for (const slug of detail.relatedRecipeSlugs) assert(recipes.some(r => r.slug === slug));
 const text = [detail.intro, ...detail.sections.flatMap(s => s.paragraphs), ...detail.faq.map(q => q.answer)].join(' ');
 for (const [, type, slug] of text.matchAll(/\]\(\/(articles|recipes|flavors)\/([a-z0-9-]+)/g)) assert(type === 'articles' ? list.some(x => x.slug === slug) : type === 'recipes' ? recipes.some(x => x.slug === slug) : ['brine','sunflower','olive-oil','pepper','smoked','dill'].includes(slug));
}
const seed = seeds[0];
const slug = `qa-article-${Date.now()}`; let id;
try {
 let r = await send('/articles', 'POST', { ...seed, slug, intro: 'متن کوتاه', sections: [], faq: [] }); assert.equal(r.status, 201); id = r.data._id;
 assert.equal((await send('/public/articles/' + slug)).status, 404);
 assert.equal((await send(`/articles/${id}/status`, 'PATCH', { status: 'published' })).status, 400);
 assert.equal((await send('/articles', 'POST', { ...seed, slug })).status, 409);
 for (const body of [{sections:null},{intro:'[خطر](javascript:alert)'},{cover:{key:'general/missing.jpg',alt:'آزمایش'}},{sections:[seed.sections[0],seed.sections[0]]}]) assert.equal((await send(`/articles/${id}`, 'PATCH', body)).status, 400);
 assert.equal((await send(`/articles/${id}`, 'PATCH', { ...seed, slug })).status, 200);
 assert.equal((await send(`/articles/${id}/status`, 'PATCH', { status: 'published' })).status, 200);
 assert.equal((await send('/public/articles/' + slug)).status, 200);
 assert.equal((await send(`/articles/${id}`, 'PATCH', { slug:slug+'-changed' })).status, 400);
 assert.equal((await send(`/articles/${id}`, 'DELETE')).status, 400);
 assert.equal((await send(`/articles/${id}/status`, 'PATCH', { status: 'draft' })).status, 200);
 assert.equal((await send('/public/articles/' + slug)).status, 404);
} finally { if (id) { await send(`/articles/${id}/status`, 'PATCH', {status:'draft'}); assert.equal((await send(`/articles/${id}`, 'DELETE')).status, 200); } }
assert.equal((await send('/public/articles')).data.length, list.length);
console.log('PASS: content/cross-links, authentication, draft isolation, word limits, null/unsafe-link/image/section validation, publish/withdraw/delete, stable URLs. Temporary record removed.');
