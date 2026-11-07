import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { BrineImage } from '../brine/types';
import type { ProductCopy } from './types';
import recipeContent from '../recipes/content.json';

export interface FlavorMedia {
  wrap: BrineImage; wrapSmall: BrineImage; lid: BrineImage; logo: BrineImage; logoLatin: BrineImage;
  ideas: Record<string, BrineImage>;
}

interface ManifestEntry { key?: string; url?: string; description?: string }

/** Asset keys always come from the upload API's manifest, never guessed URLs. */
export async function getFlavorMedia(prefix: string, recipes?: ProductCopy['recipes']['items']): Promise<FlavorMedia> {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), '..', 'assets', 'image-manifest.json'), 'utf8')) as { images: ManifestEntry[] };
  const pick = (description: string, width: number, height: number, alt: string): BrineImage => {
    const entry = [...manifest.images].reverse().find(item => item.description === description);
    if (!entry?.key || !entry.url || !/^https?:\/\//.test(entry.url)) throw new Error(`Missing uploaded product asset: ${description}`);
    return { key: entry.key, url: `/media/${entry.key.split('/').map(encodeURIComponent).join('/')}`, width, height, alt };
  };
  const ideas = {
    'brine-idea-salad': pick('brine-idea-salad', 1024, 1536, 'تصویر مفهومی ایده سرو سالاد، نه عکس محصول'),
    'brine-idea-sandwich': pick('brine-idea-sandwich', 1254, 1254, 'تصویر مفهومی ایده سرو ساندویچ، نه عکس محصول'),
    'brine-idea-pasta': pick('brine-idea-pasta', 1254, 1254, 'تصویر مفهومی ایده سرو پاستا، نه عکس محصول'),
  };
  const recipePhotos = recipeContent.flatMap(recipe => Object.values(recipe.photos));
  return {
    wrap: pick(`${prefix}-label-wrap-4k`, 4096, 628, 'دورپیچ واقعی بسته‌بندی محصول'),
    wrapSmall: pick(`${prefix}-label-wrap-2k`, 2048, 314, 'دورپیچ واقعی بسته‌بندی محصول'),
    lid: pick(`${prefix}-lid-1k`, 1024, 1022, 'طرح واقعی درِ قوطی'),
    logo: pick('atmat-logo-fa', 700, 447, 'ات‌مت'),
    logoLatin: pick('atmat-logo-en', 692, 450, 'At Mat'),
    ideas: recipes ? Object.fromEntries(recipes.map(recipe => {
      const photo = recipePhotos.find(photo => photo.description === recipe.image);
      if (photo) return [recipe.image, pick(photo.description, photo.width, photo.height, photo.alt)];
      const idea = ideas[recipe.image as keyof typeof ideas];
      if (!idea) throw new Error(`Missing serving idea: ${recipe.image}`);
      return [recipe.image, idea];
    })) : ideas,
  };
}
