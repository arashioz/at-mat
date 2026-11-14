import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { S3Client, HeadBucketCommand, CreateBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const bundle = process.env.ATMAT_ASSET_BUNDLE;
if (!bundle) throw new Error('Set ATMAT_ASSET_BUNDLE to the extracted deployment bundle directory.');
for (const key of ['MINIO_ENDPOINT', 'MINIO_BUCKET', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']) {
  if (!process.env[key]) throw new Error(`Missing environment variable: ${key}`);
}
const inventory = JSON.parse(await readFile(path.join(bundle, 'inventory.json'), 'utf8'));
if (!Array.isArray(inventory.objects) || !inventory.objects.length) throw new Error('The bundle contains no storage objects.');
// Verify the entire backup before changing the destination bucket.
for (const item of inventory.objects) {
  if (!item.key || path.posix.isAbsolute(item.key) || item.key.includes('\\') ||
      item.key.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error('Unsafe backup object key.');
  }
  const bytes = await readFile(path.join(bundle, 'minio/at-mat-assets', item.key));
  if (createHash('sha256').update(bytes).digest('hex') !== item.sha256) {
    throw new Error(`Checksum failed: ${item.key}`);
  }
  if (!item.contentType?.startsWith('image/') && !item.contentType?.startsWith('video/')) throw new Error(`Invalid Content-Type: ${item.key}`);
}
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
try {
  const bucket = process.env.MINIO_BUCKET;
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch (error) {
    if (error.$metadata?.httpStatusCode !== 404) throw error;
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  for (const item of inventory.objects) {
    await client.send(new PutObjectCommand({
      Bucket: bucket, Key: item.key,
      Body: await readFile(path.join(bundle, 'minio/at-mat-assets', item.key)),
      ContentType: item.contentType,
    }));
  }
  console.log(`Restored ${inventory.objects.length} images with original keys and Content-Type.`);
} finally {
  client.destroy();
}
