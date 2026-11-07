/** Idempotent import for the approved local article collection. Does not overwrite edits. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const api = process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api';
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Load the local environment before running this script.');
const request = async (route, init = {}) => {
  const response = await fetch(api + route, init); const data = await response.json();
  if (!response.ok) throw new Error(`${route}: ${response.status} ${JSON.stringify(data.message)}`);
  return data;
};
const auth = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
const headers = { Authorization: `Bearer ${auth.accessToken}`, 'Content-Type': 'application/json' };
const seedFile = process.env.ATMAT_ARTICLE_SEED_FILE
  ? resolve(process.env.ATMAT_ARTICLE_SEED_FILE)
  : new URL('../seeds/articles.json', import.meta.url);
const seeds = JSON.parse(await readFile(seedFile, 'utf8'));
const existing = await request('/articles', { headers }); const added = [];
for (const seed of seeds) {
  if (existing.some(item => item.slug === seed.slug)) { console.log('Unchanged:', seed.slug); continue; }
  added.push(await request('/articles', { method: 'POST', headers, body: JSON.stringify(seed) }));
}
for (const article of added) {
  await request(`/articles/${article._id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'published' }) });
  console.log('Published:', article.slug);
}
