import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { planFromCatalog, preferences, normalize } = require('../dist/kitchen/kitchen-planner.js');
const { KitchenAgentService } = require('../dist/kitchen/kitchen-agent.service.js');
const { MongoClient, ObjectId } = require('mongodb');
const catalog = JSON.parse(await readFile(new URL('../../web/src/features/recipes/content.json', import.meta.url), 'utf8'));
const message = (text, reply) => ({ id: randomUUID(), requestId: randomUUID(), role: reply ? 'assistant' : 'user', text, createdAt: new Date().toISOString(), ...(reply && { reply }) });

test('personalization respects exclusions, equipment and conversational servings', () => {
  const first = planFromCatalog(catalog, [], 'با تن و سیب‌زمینی بدون فر و بدون لبنیات برای ۴ نفر غذا می‌خوام');
  assert.equal(first.recipe.servings, 4);
  assert.doesNotMatch(normalize(first.recipe.ingredients.join(' ')), /ماست|پنیر|خامه|کره/);
  assert.doesNotMatch(normalize(first.recipe.steps.map(s => s.text).join(' ')), /(?:^|\s)فر(?:\s|$)/);
  const follow = planFromCatalog(catalog, [message('بدون لبنیات برای ۴ نفر'), message(first.text, first)], 'لیست خرید این رسپی را بده');
  assert.equal(follow.recipe.sourceSlug, first.recipe.sourceSlug);
  assert.equal(follow.recipe.servings, 4);
  assert.match(follow.text, /فهرست کامل/);
  const third = planFromCatalog(catalog, [message('برای ۴ نفر'), message(first.text, first)], 'برای دو نفر تنظیمش کن');
  assert.equal(third.recipe.servings, 2);
});
test('honors the requested flavor and dish, and reads Persian serving counts', () => {
  const sunflower = planFromCatalog(catalog, [], 'برای ۴ نفر یک رسپی سریع با تن آفتابگردان');
  assert.equal(sunflower.recipe.flavor, 'sunflower');
  assert.equal(sunflower.recipe.servings, 4);
  const salad = planFromCatalog(catalog, [], 'یه سالاد، بدون لبنیات و بدون تخم‌مرغ');
  assert.match(salad.recipe.title, /سالاد/);
  assert.equal(planFromCatalog(catalog, [], 'پای تن ماهی بدون فر').recipe, null);
  assert.equal(planFromCatalog(catalog, [], 'برای ده نفر سالاد تن').recipe.servings, 10);
  for (const prompt of ['برای ۲٫۵ نفر سالاد تن', 'برای -۲ نفر سالاد تن', 'برای سیزده نفر سالاد تن']) {
    assert.equal(planFromCatalog(catalog, [], prompt).recipe, null, prompt);
  }
  assert.equal(planFromCatalog(catalog, [], 'سلام').recipe, null);
  assert.equal(planFromCatalog(catalog, [], 'آدرس دفتر ات‌مت کجاست؟').links[0].href, '/about');
});
test('does not propose tuna for fish allergies, vegan requests, or invalid serving counts', () => {
  for (const prompt of ['به ماهی حساسیت دارم', 'غذای وگان می‌خوام', 'بدون تن ماهی', 'برای ۰ نفر', 'برای ۵۰ نفر']) assert.equal(planFromCatalog(catalog, [], prompt).recipe, null, prompt);
  assert.equal(preferences([], 'برای ١٢ نفر').servings, 12);
});
test('storage and medical questions have bounded answers and reviewed references', () => {
  const storage = planFromCatalog(catalog, [], 'چطور در یخچال نگهداری کنم؟');
  assert.equal(storage.recipe, null);
  assert(storage.links.every(x => /^https:\/\/(www.fda.gov|ask.fsis.usda.gov)\//.test(x.href)));
  assert.match(planFromCatalog(catalog, [], 'قوطی متورم را بجوشانم؟').text, /مصرف نکن/);
  assert.equal(planFromCatalog(catalog, [], 'در بارداری چقدر تن بخورم؟').recipe, null);
});
test('model adapter uses strict schema, no storage and validated source links; failures fall back honestly', async () => {
  const originalFetch = globalThis.fetch;
  let body;
  const config = { get: key => ({ KITCHEN_AI_PROVIDER: 'openai', KITCHEN_AI_MODEL: 'test-model', OPENAI_API_KEY: 'synthetic-test-key' })[key] };
  const service = new KitchenAgentService({ publicList: async () => catalog }, config);
  const output = { text: 'این پیشنهاد را بر پایهٔ رسپی ات‌مت آماده کردم.', sourceSlug: catalog[0].slug, recipe: { title: 'سالاد برای تو', servings: 2, ingredients: catalog[0].ingredients, steps: catalog[0].steps, tip: catalog[0].tip }, suggestions: ['لیست خرید را بده'] };
  const fake = data => new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(data) }] }] }));
  try {
    globalThis.fetch = async (_url, options) => { body = JSON.parse(options.body); return fake(output); };
    const reply = await service.reply([], 'یک سالاد برای دو نفر');
    assert.equal(reply.mode, 'model'); assert.equal(body.store, false); assert.equal(body.text.format.strict, true);
    assert(reply.links.every(link => link.href.startsWith('/recipes/') || link.href.startsWith('/flavors/')));
    globalThis.fetch = async () => fake({ ...output, sourceSlug: 'unpublished-or-invented' });
    assert.equal((await service.reply([], 'یک سالاد')).mode, 'catalog');
    globalThis.fetch = async () => fake({ ...output, recipe: { ...output.recipe, ingredients: ['۱ پیمانه ماست'] } });
    assert.equal((await service.reply([], 'سالاد بدون لبنیات')).mode, 'catalog');
    globalThis.fetch = async () => { throw new Error('timeout'); };
    const fallback = await service.reply([], 'یک سالاد');
    assert.equal(fallback.mode, 'catalog'); assert.match(fallback.text, /فعلاً در دسترس نیست/);
  } finally { globalThis.fetch = originalFetch; }
});

test('local API: private sessions, guest migration, retries, saved snapshots and CSRF', async () => {
  const base = process.env.KITCHEN_TEST_URL ?? 'http://localhost:3002';
  const backend = 'http://127.0.0.1:3010/api';
  assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'tests are local-only');
  const members = new Set();
  const account = { name: 'آزمایش آشپزخانه', email: `kitchen-qa-${randomUUID()}@example.invalid`, password: `qa-${randomUUID()}` };
  const client = () => ({ cookie: '' });
  const a = client(), b = client();
  async function call(client, path, method = 'GET', body, expected = 200) {
    const response = await fetch(`${base}/api/kitchen/${path}`, {
      method, headers: { Origin: base, 'Content-Type': 'application/json', ...(client.cookie && { Cookie: client.cookie }) },
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
    assert.equal(data.token, undefined, 'browser never receives a bearer token');
    const cookie = response.headers.get('set-cookie');
    if (cookie) {
      if (!path.endsWith('logout')) { assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); }
      client.cookie = cookie.split(';')[0];
    }
    if (data.user) members.add(data.user.id);
    return data;
  }
  const database = new MongoClient(process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27018/at_mat_db');
  await database.connect();
  try {
    assert.equal((await call(a, 'session')).user, null);
    await call(a, 'conversations', 'GET', undefined, 401);
    await call(a, 'session', 'POST', {}, 201);
    const guestCookie = a.cookie;
    await call(b, 'session', 'POST', {}, 201);
    const id = randomUUID();
    await call(a, `conversations/${id}`, 'PUT', {});
    await call(a, `conversations/${id}`, 'PUT', {});
    assert.equal((await call(a, 'conversations')).length, 1);
    await call(b, `conversations/${id}`, 'GET', undefined, 404);
    await call(b, `conversations/${id}`, 'PUT', {}, 404);
    const payload = { text: 'سالاد بدون لبنیات برای ۴ نفر', requestId: randomUUID() };
    const conversation = await call(a, `conversations/${id}/messages`, 'POST', payload, 201);
    assert.equal(conversation.messages.length, 2);
    assert.equal(conversation.messages[1].reply.recipe.servings, 4);
    assert.equal((await call(a, `conversations/${id}/messages`, 'POST', payload, 201)).messages.length, 2);
    await call(a, `conversations/${id}/messages`, 'POST', { ...payload, text: 'محتوای دیگری' }, 409);
    await call(a, `conversations/${id}/messages`, 'POST', { text: '', requestId: randomUUID() }, 400);
    await call(a, `conversations/${id}/messages`, 'POST', { text: 'x'.repeat(2001), requestId: randomUUID() }, 400);
    const save = { conversationId: id, messageId: conversation.messages[1].id };
    await call(a, 'saved', 'POST', save, 401);
    await call(a, 'register', 'POST', { ...account, role: 'admin' }, 400);
    await call(a, 'register', 'POST', account, 201);
    await call({ cookie: guestCookie }, 'conversations', 'GET', undefined, 401);
    assert.equal((await call(a, `conversations/${id}`)).messages.length, 2);
    const saved = await call(a, 'saved', 'POST', save, 201);
    assert.equal((await call(a, 'saved', 'POST', save, 201)).id, saved.id);
    assert.equal((await call(a, 'saved')).length, 1);
    assert.equal((await call(b, 'saved')).length, 0);
    await call(b, `saved/${saved.id}`, 'DELETE', undefined, 404);
    const token = a.cookie.split('=')[1];
    assert.equal((await fetch(`${backend}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })).status, 401, 'consumer session cannot access ERP');
    const csrf = await fetch(`${base}/api/kitchen/logout`, { method: 'POST', headers: { Cookie: a.cookie, Origin: 'https://foreign.example', 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(csrf.status, 403);
    assert.equal((await fetch(`${base}/api/kitchen/../../auth/me`)).status, 404);
    const oldCookie = a.cookie;
    await call(a, 'logout', 'POST', {}, 201);
    await call({ cookie: oldCookie }, 'conversations', 'GET', undefined, 401);
    await call(a, 'login', 'POST', { email: account.email, password: 'wrong-password-test' }, 401);
    const guestConversation = randomUUID();
    await call(b, `conversations/${guestConversation}`, 'PUT', {});
    await call(b, 'login', 'POST', { email: account.email, password: account.password }, 201);
    assert.equal((await call(b, 'conversations')).length, 2, 'login transfers only own guest conversations');
    assert.equal((await call(b, 'saved'))[0].recipe.title, saved.recipe.title);
    await call(b, `saved/${saved.id}`, 'DELETE');
    assert.equal((await call(b, 'saved')).length, 0);
    await call(b, 'logout', 'POST', {}, 201);
    const rows = await database.db().collection('kitchen_members').find({ _id: { $in: [...members].map(id => new ObjectId(id)) } }).toArray();
    assert(rows.every(row => !row.passwordHash || /^\$2[aby]\$/.test(row.passwordHash)), 'passwords are hashed');
    const sessions = await database.db().collection('kitchen_sessions').find({ memberId: { $in: [...members].map(id => new ObjectId(id)) } }).toArray();
    assert(sessions.every(row => !('token' in row) && /^[a-f0-9]{64}$/.test(row.tokenHash)), 'only token hashes are persisted');
  } finally {
    const memberIds = [...members].map(id => new ObjectId(id));
    for (const collection of ['kitchen_conversations', 'kitchen_saved_recipes', 'kitchen_sessions']) await database.db().collection(collection).deleteMany({ memberId: { $in: memberIds } });
    await database.db().collection('kitchen_members').deleteMany({ _id: { $in: memberIds } });
    await database.close();
  }
});
