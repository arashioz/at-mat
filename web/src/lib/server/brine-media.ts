import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrineImage } from '@/features/brine/types';

export type { BrineImage };

interface ManifestEntry {
  key?: string;
  url?: string;
  description?: string;
  mimeType?: string;
}

const SPECS = {
  'brine-label-wrap': {
    alt: 'دورپیچ واقعی کنسرو ماهی تن در آب‌نمک ات‌مت',
    width: 7698,
    height: 1181,
  },
  'brine-lid': {
    alt: 'روی در کنسرو ماهی تن در آب‌نمک ات‌مت',
    width: 1511,
    height: 1508,
  },
  'brine-idea-salad': {
    alt: 'تصویر مفهومی ایده سرو سالاد، نه عکس محصول',
    width: 1024,
    height: 1536,
  },
  'brine-idea-sandwich': {
    alt: 'تصویر مفهومی ایده سرو ساندویچ، نه عکس محصول',
    width: 1254,
    height: 1254,
  },
  'brine-idea-pasta': {
    alt: 'تصویر مفهومی ایده سرو پاستا، نه عکس محصول',
    width: 1254,
    height: 1254,
  },
} as const;

export type BrineImageId = keyof typeof SPECS;

function safeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function getBrineMedia(): Promise<{
  wrap: BrineImage;
  lid: BrineImage;
  ideas: Record<'brine-idea-salad' | 'brine-idea-sandwich' | 'brine-idea-pasta', BrineImage>;
}> {
  const manifestPath = path.join(process.cwd(), '..', 'assets', 'image-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as { images?: ManifestEntry[] };
  const images = manifest.images ?? [];
  const pick = (description: BrineImageId): BrineImage => {
    const entry = [...images].reverse().find((image) => image.description === description && typeof image.url === 'string' && typeof image.key === 'string');
    if (!entry?.url || !entry.key || !safeUrl(entry.url)) {
      throw new Error(`Missing storage image: ${description}`);
    }
    // This MinIO build rejects bucket CORS. The key comes from the storage API;
    // the browser loads that object through the same-origin /media proxy.
    const url = `/media/${entry.key.split('/').map(encodeURIComponent).join('/')}`;
    return { key: entry.key, url, ...SPECS[description] };
  };
  return {
    wrap: pick('brine-label-wrap'),
    lid: pick('brine-lid'),
    ideas: {
      'brine-idea-salad': pick('brine-idea-salad'),
      'brine-idea-sandwich': pick('brine-idea-sandwich'),
      'brine-idea-pasta': pick('brine-idea-pasta'),
    },
  };
}
