import { mediaHref, type MediaAsset } from '../../lib/media';
import { saveDownload } from './brand-book-api';

// The source JPG, PNG and WebP files are already compressed. Store them unchanged in the ZIP.
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  }
  return value;
});

function checksum(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function header(length: number, signature: number) {
  const bytes = new ArrayBuffer(length);
  const view = new DataView(bytes);
  view.setUint32(0, signature, true);
  return { bytes, view };
}

function archiveName(asset: MediaAsset, used: Set<string>) {
  const [category, key] = asset.key.split('/');
  const original = asset.originalName.split(/[\\/]/).pop() || key;
  const clean = original.replace(/[\u0000-\u001f<>:"|?*]/g, '_').trim().replace(/^\.+/, '');
  const extension = key.slice(key.lastIndexOf('.'));
  const stem = Array.from(clean.replace(/\.[^.]+$/, '')).slice(0, 54).join('') || 'image';
  let name = `${category}/${stem}${extension}`;
  for (let suffix = 2; used.has(name.toLowerCase()); suffix++) name = `${category}/${stem}-${suffix}${extension}`;
  used.add(name.toLowerCase());
  return name;
}

export async function downloadAssetArchive(assets: MediaAsset[], onProgress: (count: number) => void) {
  const entries: BlobPart[] = [];
  const directory: BlobPart[] = [];
  const encoder = new TextEncoder();
  const usedNames = new Set<string>();
  const controller = new AbortController();
  let offset = 0;
  let directorySize = 0;
  try {
    for (let index = 0; index < assets.length; index += 4) {
      const batch = await Promise.all(assets.slice(index, index + 4).map(async asset => {
        const response = await fetch(mediaHref(asset.key), { signal: controller.signal });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
          throw new Error(`دریافت تصویر «${asset.originalName}» انجام نشد. دوباره تلاش کنید.`);
        }
        return { asset, bytes: await response.arrayBuffer() };
      }));
      for (const { asset, bytes } of batch) {
        const name = encoder.encode(archiveName(asset, usedNames));
        const crc = checksum(new Uint8Array(bytes));
        const local = header(30, 0x04034b50);
        local.view.setUint16(4, 20, true);
        local.view.setUint16(6, 0x0800, true); // UTF-8 file names
        local.view.setUint16(12, 33, true); // DOS date: 1980-01-01
        local.view.setUint32(14, crc, true);
        local.view.setUint32(18, bytes.byteLength, true);
        local.view.setUint32(22, bytes.byteLength, true);
        local.view.setUint16(26, name.length, true);

        const central = header(46, 0x02014b50);
        central.view.setUint16(4, 20, true);
        new Uint8Array(central.bytes, 6, 24).set(new Uint8Array(local.bytes, 4, 24));
        central.view.setUint32(42, offset, true);
        entries.push(local.bytes, name, bytes);
        directory.push(central.bytes, name);
        offset += local.bytes.byteLength + name.length + bytes.byteLength;
        directorySize += central.bytes.byteLength + name.length;
        if (offset + directorySize > 0xffffffff || assets.length > 0xffff) throw new Error('حجم مجموعه بیشتر از ظرفیت فایل ZIP است.');
      }
      onProgress(Math.min(index + batch.length, assets.length));
    }
  } finally {
    controller.abort();
  }

  const footer = header(22, 0x06054b50);
  footer.view.setUint16(8, assets.length, true);
  footer.view.setUint16(10, assets.length, true);
  footer.view.setUint32(12, directorySize, true);
  footer.view.setUint32(16, offset, true);
  saveDownload(new Blob([...entries, ...directory, footer.bytes], { type: 'application/zip' }), 'at-mat-brand-assets.zip');
}
