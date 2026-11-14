import 'server-only';
import { cache } from 'react';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrineImage } from '../brine/types';

export interface FlavorMedia {
  wrap: BrineImage; wrapSmall: BrineImage; lid: BrineImage; logo: BrineImage; logoLatin: BrineImage;
  ideas: Record<string, BrineImage>;
}

interface ManifestEntry { key?: string; url?: string; description?: string }
type ImageDetails = Pick<BrineImage, 'width' | 'height' | 'alt'>;

const readManifest = cache(async () => {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), '..', 'assets', 'image-manifest.json'), 'utf8')) as { images: ManifestEntry[] };
  return manifest.images;
});

function findImage(images: ManifestEntry[], description: string, details: ImageDetails): BrineImage | undefined {
  const entry = images.findLast(item => item.description === description);
  if (!entry?.key || !entry.url || !/^https?:\/\//.test(entry.url)) return;
  return { key: entry.key, url: `/media/${entry.key.split('/').map(encodeURIComponent).join('/')}`, ...details };
}

/** Asset keys always come from the upload API's manifest. */
export async function getUploadedImage(description: string, details: ImageDetails) {
  return findImage(await readManifest(), description, details);
}

export const getFlavorMedia = cache(async (prefix: string): Promise<FlavorMedia> => {
  const images = await readManifest();
  const pick = (description: string, width: number, height: number, alt: string): BrineImage => {
    const image = findImage(images, description, { width, height, alt });
    if (!image) throw new Error(`Missing uploaded product asset: ${description}`);
    return image;
  };
  const ideas = {
    'brine-idea-salad': pick('brine-idea-salad', 1024, 1536, 'تصویر مفهومی ایده سرو سالاد، نه عکس محصول'),
    'brine-idea-sandwich': pick('brine-idea-sandwich', 1254, 1254, 'تصویر مفهومی ایده سرو ساندویچ، نه عکس محصول'),
    'brine-idea-pasta': pick('brine-idea-pasta', 1254, 1254, 'تصویر مفهومی ایده سرو پاستا، نه عکس محصول'),
  };
  return {
    wrap: pick(`${prefix}-label-wrap-4k`, 4096, 628, 'دورپیچ واقعی بسته‌بندی محصول'),
    wrapSmall: pick(`${prefix}-label-wrap-2k`, 2048, 314, 'دورپیچ واقعی بسته‌بندی محصول'),
    lid: pick(`${prefix}-lid-1k`, 1024, 1022, 'طرح واقعی درِ قوطی'),
    logo: pick('atmat-logo-fa', 700, 447, 'ات‌مت'),
    logoLatin: pick('atmat-logo-en', 692, 450, 'At Mat'),
    ideas,
  };
});
