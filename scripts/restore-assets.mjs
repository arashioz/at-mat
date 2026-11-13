import { createRequire } from 'node:module';
import { open, readFile, rename, unlink } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

const require = createRequire(new URL('../backend/package.json', import.meta.url));
const [mode, ...extraArgs] = process.argv.slice(2);
if (extraArgs.length || (mode && mode !== '--verify-only')) {
  throw new Error('Usage: node scripts/restore-assets.mjs [--verify-only]');
}
const bundle = process.env.ATMAT_ASSET_BUNDLE;
if (!bundle) throw new Error('Set ATMAT_ASSET_BUNDLE to the extracted deployment bundle directory.');
const inventory = JSON.parse(await readFile(path.join(bundle, 'inventory.json'), 'utf8'));
if (!Array.isArray(inventory.objects) || !inventory.objects.length) throw new Error('The bundle contains no storage objects.');
if (inventory.kind !== undefined && !['full', 'update'].includes(inventory.kind)) {
  throw new Error('Unknown asset bundle kind.');
}
const isUpdate = inventory.kind === 'update';
function safeKey(key) {
  return typeof key === 'string' && key.length > 0 && !path.posix.isAbsolute(key) && !key.includes('\\') &&
    key.split('/').every(segment => segment && segment !== '.' && segment !== '..');
}
if (isUpdate && (!Array.isArray(inventory.requiredBaseKeys) || !inventory.requiredBaseKeys.length ||
  !inventory.requiredBaseKeys.every(safeKey) || new Set(inventory.requiredBaseKeys).size !== inventory.requiredBaseKeys.length)) {
  throw new Error('The update must list the existing storage objects it depends on.');
}
// Verify the entire backup before changing the destination bucket.
const keys = new Set();
for (const item of inventory.objects) {
  if (!safeKey(item.key)) throw new Error('Unsafe backup object key.');
  if (keys.has(item.key)) throw new Error(`Duplicate backup object key: ${item.key}`);
  keys.add(item.key);
  const image = typeof item.contentType === 'string' && item.contentType.startsWith('image/');
  const video = item.contentType === 'video/mp4' && item.key.startsWith('branding/') && item.key.endsWith('.mp4');
  if (!image && !video) throw new Error(`Unsupported media Content-Type: ${item.key}`);
  const bytes = await readFile(path.join(bundle, 'minio/at-mat-assets', item.key));
  if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) {
    throw new Error(`Checksum failed: ${item.key}`);
  }
}
if (mode === '--verify-only') {
  console.log(`Verified ${inventory.objects.length} media objects and their checksums.`);
  process.exit(0);
}
for (const key of ['MINIO_ENDPOINT', 'MINIO_BUCKET', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}
const { S3Client, HeadBucketCommand, CreateBucketCommand, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: process.env.MINIO_REGION || 'us-east-1',
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
});
const assetRoot = path.join(bundle, 'minio/at-mat-assets');
const manifestPath = new URL('../assets/image-manifest.json', import.meta.url);
const imageDescription = item => item.description?.trim() || undefined;

function assertSameEntry(current, incoming) {
  for (const field of ['key', 'category', 'description', 'mimeType', 'size']) {
    if (current[field] !== incoming[field]) {
      throw new Error(`Manifest metadata differs for ${incoming.key} (${field}); resolve the conflict before importing.`);
    }
  }
}

function parseImageManifest(source) {
  const manifest = JSON.parse(source);
  if (manifest.version !== 1 || !Array.isArray(manifest.categories) || !Array.isArray(manifest.images)) {
    throw new Error('Invalid image manifest.');
  }
  return manifest;
}

async function readImageManifest(file) {
  return parseImageManifest(await readFile(file, 'utf8'));
}

async function restoreUpdate(bucket) {
  const liveSource = await readFile(manifestPath, 'utf8');
  const live = parseImageManifest(liveSource);
  const bundled = await readImageManifest(path.join(bundle, 'repo/assets/image-manifest.json'));
  const liveByKey = new Map(live.images.map(item => [item.key, item]));
  const bundledByKey = new Map(bundled.images.map(item => [item.key, item]));
  if (liveByKey.size !== live.images.length || bundledByKey.size !== bundled.images.length) {
    throw new Error('Duplicate image manifest key.');
  }

  for (const key of inventory.requiredBaseKeys) {
    const current = liveByKey.get(key);
    const expected = bundledByKey.get(key);
    if (!current || !expected) throw new Error(`Base asset is missing from the manifest: ${key}`);
    assertSameEntry(current, expected);
  }

  const additions = [];
  for (const item of inventory.objects.filter(item => item.contentType.startsWith('image/'))) {
    const image = bundledByKey.get(item.key);
    if (!image || image.size !== item.bytes || image.mimeType !== item.contentType || !live.categories.includes(image.category)) {
      throw new Error(`The bundle image manifest does not match its inventory: ${item.key}`);
    }
    const current = liveByKey.get(item.key);
    if (current) assertSameEntry(current, image);
    const description = imageDescription(image);
    if (description && live.images.some(entry => entry.key !== image.key && imageDescription(entry) === description)) {
      throw new Error(`The destination already uses the asset description: ${description}`);
    }
    if (!current) additions.push(image);
  }

  // Check the base and any prior attempt before adding objects. Conditional writes
  // also keep retries from replacing a destination object with different content.
  for (let start = 0; start < inventory.requiredBaseKeys.length; start += 8) {
    await Promise.all(inventory.requiredBaseKeys.slice(start, start + 8).map(key => requireObject(bucket, key)));
  }
  const missing = [];
  for (const item of inventory.objects) {
    if (!await sameObject(bucket, item)) missing.push(item);
  }
  for (const item of missing) {
    try {
      await putObject(bucket, item, '*');
    } catch (error) {
      if (error.$metadata?.httpStatusCode !== 412 || !await sameObject(bucket, item)) throw error;
    }
  }

  if (additions.length) {
    const temp = new URL(`image-manifest.json.${randomUUID()}.restore-tmp`, manifestPath);
    const file = await open(temp, 'wx');
    try {
      try {
        await file.writeFile(JSON.stringify({ ...live, images: [...live.images, ...additions] }, null, 2) + '\n');
      } finally {
        await file.close();
      }
      if (await readFile(manifestPath, 'utf8') !== liveSource) {
        throw new Error('The destination manifest changed during import. Pause media edits and retry.');
      }
      await rename(temp, manifestPath);
    } finally {
      await unlink(temp).catch(() => {});
    }
  }
  console.log(`Verified ${inventory.requiredBaseKeys.length} base objects. Restored ${missing.length} new objects and merged ${additions.length} image entries.`);
}

async function requireObject(bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    if (error.$metadata?.httpStatusCode !== 404) throw error;
    throw new Error(`Base asset is missing from the bucket: ${key}`);
  }
}

async function sameObject(bucket, item) {
  try {
    const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: item.key }));
    const bytes = await object.Body.transformToByteArray();
    if (object.ContentType !== item.contentType || createHash('sha256').update(bytes).digest('hex') !== item.sha256) {
      throw new Error(`Existing storage object differs from the bundle: ${item.key}`);
    }
    return true;
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

async function putObject(bucket, item, ifNoneMatch) {
  await client.send(new PutObjectCommand({
    Bucket: bucket, Key: item.key,
    Body: await readFile(path.join(assetRoot, item.key)),
    ContentType: item.contentType,
    IfNoneMatch: ifNoneMatch,
  }));
}

try {
  const bucket = process.env.MINIO_BUCKET;
  if (isUpdate) {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    await restoreUpdate(bucket);
  } else {
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (error.$metadata?.httpStatusCode !== 404) throw error;
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
    }
    for (const item of inventory.objects) await putObject(bucket, item);
    console.log(`Restored ${inventory.objects.length} media objects with original keys and Content-Type.`);
  }
} finally {
  client.destroy();
}
