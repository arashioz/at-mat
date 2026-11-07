import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const required = [
  'assets/image-manifest.json',
  ...['Regular', 'Medium', 'Bold', 'ExtraBold', 'Black'].map(weight =>
    `web/src/fonts/peyda/PeydaWebFaNum-${weight}.woff2`),
];
const missing = [];
for (const file of required) {
  try { await access(new URL(file, root)); } catch { missing.push(file); }
}
if (missing.length) {
  console.error('Restore the separately delivered assets before running or building:');
  missing.forEach(file => console.error(`  ${file}`));
  console.error('See web/README.md for the asset handoff and MinIO restore steps.');
  process.exitCode = 1;
} else {
  const manifest = JSON.parse(await readFile(new URL(required[0], root), 'utf8'));
  if (!Array.isArray(manifest.images) || manifest.images.length === 0 ||
      manifest.images.some(image => !image.key || !image.url)) {
    throw new Error('The image manifest must contain the uploaded objects and their API-issued keys/URLs.');
  }
  console.log(`Asset files ready: 5 Peyda fonts and ${manifest.images.length} manifest entries.`);
  console.log('Run npm run check:integration after startup to verify pages, APIs and stored objects.');
}
