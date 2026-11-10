import type { RecipePageText } from '../common/content-copy';

export const RECIPE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RECIPE_IMAGE_KEY = /^(general|products|branding)\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
export const RECIPE_PHOTO_SLOTS = ['cover-a', 'cover-b', 'ingredients', 'key-step', 'serving-detail'] as const;
export const RECIPE_FLAVORS = ['brine', 'olive-oil', 'sunflower', 'pepper', 'smoked', 'dill'] as const;

export interface RecipePhoto {
  key: string;
  alt: string;
  width: number;
  height: number;
  generated?: boolean;
  caption?: string;
}

type RecipePhotos<T> = Partial<Record<(typeof RECIPE_PHOTO_SLOTS)[number], T>>;

export interface RecipeFields {
  title: string;
  intro: string;
  category: string;
  flavor: (typeof RECIPE_FLAVORS)[number] | '';
  flavorLabel: string;
  servings: string;
  timing: string;
  duration: string;
  difficulty: string;
  ingredients: string[];
  preparation: string;
  steps: { title: string; text: string }[];
  tip: string;
  nutrition: { serving: string; rows: { name: string; value: string }[]; note: string };
  faq: { question: string; answer: string }[];
  seoTitle: string;
  metaDescription: string;
  photos: RecipePhotos<RecipePhoto>;
  pageText?: RecipePageText;
  extraSections?: { title: string; text: string }[];
  relatedRecipeSlugs?: string[];
  relatedArticleSlugs?: string[];
}

export interface RecipeIdentity {
  slug: string;
  id: number;
  number: string;
}

export type PublishedRecipe = RecipeIdentity & RecipeFields;
export type SourceRecipe = RecipeIdentity & Omit<RecipeFields, 'photos'> & {
  photos: RecipePhotos<Omit<RecipePhoto, 'key'> & { description: string }>;
};

export interface RecipeSummary extends RecipeIdentity {
  title: string;
  category: string;
  flavor: RecipeFields['flavor'];
  status: 'draft' | 'published';
  hasUnpublishedChanges: boolean;
  updatedAt?: string;
}

export interface RecipeDetail extends Omit<RecipeSummary, 'title' | 'category' | 'flavor'> {
  draft: RecipeFields;
  revision: number;
}
