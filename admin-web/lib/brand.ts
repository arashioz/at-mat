import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import { isEditorialImageKey, isRasterType, mediaHref } from './media';

type ManifestEntry = { key?: string; url?: string; description?: string; mimeType?: string };

export const getAdminBrand = cache(async () => {
  let images: ManifestEntry[] = [];
  try {
    const data = JSON.parse(await readFile(path.join(process.cwd(), '..', 'assets', 'image-manifest.json'), 'utf8')) as { images?: ManifestEntry[] };
    images = data.images ?? [];
  } catch {
    // Allow sign-in while local assets are being restored.
  }
  const find = (description: string) => {
    const entry = [...images].reverse().find(image => image.description === description && image.url && image.key && isEditorialImageKey(image.key) && isRasterType(image.mimeType ?? ''));
    return entry?.key ? mediaHref(entry.key) : null;
  };
  return { logo: find('atmat-logo-fa'), cover: find('recipe-tuna-tomato-pasta-cover-a') };
});
