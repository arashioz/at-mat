import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const initialCwd = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), 'atmat-storage-'));
await mkdir(path.join(temp, 'backend'));
await mkdir(path.join(temp, 'assets'));
const manifestPath = path.join(temp, 'assets/image-manifest.json');
const fixture = {
  version: 1, categories: ['products', 'branding'],
  images: [
    { key: 'products/old label.png', url: 'http://localhost:9000/old-bucket/old.png', category: 'products', description: 'existing-product' },
    { key: 'branding/logo.png', url: 'https://previous.example/logo.png', category: 'branding', description: 'existing-logo' },
  ],
};
await writeFile(manifestPath, JSON.stringify(fixture));
process.chdir(path.join(temp, 'backend'));
const { StorageService } = require('../dist/storage/storage.service.js');
const { ConfigService } = require('@nestjs/config');
const service = new StorageService(new ConfigService({
  MINIO_PUBLIC_URL: 'https://media.example.com/assets///',
  MINIO_BUCKET: 'deploy-bucket',
  MINIO_ACCESS_KEY: 'storage-test-user',
  MINIO_SECRET_KEY: 'storage-test-only-placeholder',
}));

try {
  await test('storage media URLs follow the current deployment without rewriting original assets', async t => {
    await t.test('replaces old hosts and bucket, normalizes slashes and encodes object keys', async () => {
      const images = await service.list();
      assert.equal(images[0].url, 'https://media.example.com/assets/deploy-bucket/products/old%20label.png');
      assert.equal(images[1].url, 'https://media.example.com/assets/deploy-bucket/branding/logo.png');
      assert.equal(images[0].key, fixture.images[0].key);
      assert.deepEqual(JSON.parse(await readFile(manifestPath, 'utf8')), fixture);
    });
    await t.test('keeps category filtering and descriptive metadata', async () => {
      const images = await service.list('branding');
      assert.equal(images.length, 1);
      assert.equal(images[0].description, 'existing-logo');
      assert.equal(images[0].key, 'branding/logo.png');
    });
    await t.test('new uploads use the same public origin and store their original S3 key', async () => {
      let request;
      service.s3.send = async command => { request = command.input; return {}; };
      const uploaded = await service.upload({ buffer: Buffer.from('image fixture'), originalname: 'cover.png', mimetype: 'image/png', size: 13 }, 'products', 'test-actor', 'new-product');
      assert.equal(request.Bucket, 'deploy-bucket');
      assert.equal(request.Key, uploaded.key);
      assert.equal(uploaded.url, `https://media.example.com/assets/deploy-bucket/${uploaded.key}`);
      const stored = JSON.parse(await readFile(manifestPath, 'utf8'));
      assert.deepEqual(stored.images.slice(0, 2), fixture.images);
      assert.equal(stored.images[2].key, uploaded.key);
      assert.equal((await service.list('products')).length, 2);
    });
  });
} finally {
  service.s3.destroy();
  process.chdir(initialCwd);
  await rm(temp, { recursive: true, force: true });
}
