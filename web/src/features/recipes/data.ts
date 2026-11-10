import 'server-only';
import { cache } from 'react';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { RecipePageText } from '../../../../backend/src/common/content-copy';

export interface RecipePhoto { url: string; alt: string; width: number; height: number; generated?: boolean; caption?: string }
export interface Recipe {
  id: number; number: string; slug: string; title: string; intro: string;
  category: string; flavor: string; flavorLabel: string; servings: string;
  timing: string; duration: string; difficulty: string; ingredients: string[];
  preparation: string; steps: { title: string; text: string }[]; tip: string;
  nutrition: { serving: string; rows: { name: string; value: string }[]; note: string };
  faq: { question: string; answer: string }[];
  seoTitle: string; metaDescription: string; photos: Record<string, RecipePhoto>;
  pageText?: RecipePageText; extraSections?: { title: string; text: string }[];
  relatedRecipeSlugs?: string[]; relatedArticleSlugs?: string[];
}
export type RecipeCardData = Pick<Recipe, 'id' | 'number' | 'slug' | 'title' | 'intro' | 'category' | 'flavor' | 'flavorLabel' | 'duration' | 'difficulty' | 'photos'>;

const api = (process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api').replace(/\/+$/, '');
const mediaHref = (key: string) => `/media/${key.split('/').map(encodeURIComponent).join('/')}`;
type PublishedRecipe = Omit<Recipe, 'photos'> & { photos: Record<string, Omit<RecipePhoto, 'url'> & { key: string }> };

export const getPublishedRecipes = cache(async (): Promise<Recipe[]> => {
  // Only the published catalog is visible to the public site. Falling back to the
  // source JSON here would show recipes that an editor has taken off the site.
  const response = await fetch(`${api}/public/recipes`, { cache: 'no-store', signal: AbortSignal.timeout(6000) });
  if (!response.ok) throw new Error('رسپی‌ها فعلاً در دسترس نیستند.');
  const recipes = await response.json() as PublishedRecipe[];
  return recipes.map(({ photos, ...recipe }) => ({
    ...recipe,
    photos: Object.fromEntries(Object.entries(photos).map(([role, { key, ...photo }]) => [role, { ...photo, url: mediaHref(key) }])),
  }));
});

export const getRecipeLogo = cache(async () => {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), '..', 'assets/image-manifest.json'), 'utf8')) as {
    images: { description?: string; key: string; url: string }[];
  };
  const entry = [...manifest.images].reverse().find(item => item.description === 'atmat-logo-fa');
  if (!entry?.url || !entry.key) throw new Error('لوگوی ات‌مت پیدا نشد.');
  return mediaHref(entry.key);
});

export const getRecipeAssets = cache(async () => {
  const [recipes, logo] = await Promise.all([getPublishedRecipes(), getRecipeLogo()]);
  return { recipes, logo };
});

export function toRecipeCard(recipe: Recipe): RecipeCardData {
  const { id, number, slug, title, intro, category, flavor, flavorLabel, duration, difficulty, photos } = recipe;
  return { id, number, slug, title, intro, category, flavor, flavorLabel, duration, difficulty, photos };
}

export const flavorPages: Record<string, string> = {
  brine: '/flavors/brine', 'olive-oil': '/flavors/olive-oil', sunflower: '/flavors/sunflower',
  pepper: '/flavors/pepper', smoked: '/flavors/smoked', dill: '/flavors/dill',
};
export const faNumber = (value: number) => value.toLocaleString('fa-IR');
