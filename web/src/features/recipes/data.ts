import 'server-only';
import { cache } from 'react';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import content from './content.json';

export interface RecipePhoto { url: string; alt: string; width: number; height: number; generated?: boolean }
export interface Recipe {
  id: number; number: string; slug: string; title: string; intro: string;
  category: string; flavor: string; flavorLabel: string; servings: string;
  timing: string; duration: string; difficulty: string; ingredients: string[];
  preparation: string; steps: { title: string; text: string }[]; tip: string;
  nutrition: { serving: string; rows: { name: string; value: string }[]; note: string };
  faq: { question: string; answer: string }[];
  seoTitle: string; metaDescription: string; photos: Record<string, RecipePhoto>;
}
export type RecipeCardData = Pick<Recipe, 'id' | 'number' | 'slug' | 'title' | 'intro' | 'category' | 'flavor' | 'flavorLabel' | 'duration' | 'difficulty' | 'photos'>;

/** Word source: AT Mat — Blog Recipes/AT-Mat-blog-recipes.docx.
 * All 30 recipes retain source ingredients, steps, estimates and FAQs.
 * The first 10 retain supplied photographs; the other 20 have generated covers.
 * Prompts and storage outputs are recorded in assets/recipe-cover-prompts.json.
 * These food illustrations are not evidence of kitchen testing.
 */
export const getRecipeAssets = cache(async () => {
  const manifest = JSON.parse(await readFile(path.join(process.cwd(), '..', 'assets/image-manifest.json'), 'utf8')) as {
    images: { description?: string; key: string; url: string }[];
  };
  const url = (description: string) => {
    const entry = [...manifest.images].reverse().find(item => item.description === description);
    if (!entry?.url || !entry.key) throw new Error(`Missing uploaded recipe asset: ${description}`);
    return `/media/${entry.key.split('/').map(encodeURIComponent).join('/')}`;
  };
  const recipes: Recipe[] = content.map(item => ({
    ...item,
    photos: Object.fromEntries(Object.entries(item.photos).map(([role, photo]) => [role, { ...photo, url: url(photo.description) }])),
  }));
  return { recipes, logo: url('atmat-logo-fa') };
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
