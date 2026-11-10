import { apiFetch } from './api';
import type { RecipePageText } from '../../backend/src/common/content-copy';

export const RECIPE_FLAVORS = [
  ['brine', 'آب‌نمک'],
  ['olive-oil', 'زیتون'],
  ['sunflower', 'آفتابگردان'],
  ['pepper', 'فلفلی'],
  ['smoked', 'دودی'],
  ['dill', 'شویدی'],
] as const;

export const RECIPE_PHOTO_SLOTS = [
  { key: 'cover-a', label: 'کاور اصلی', description: 'تصویر صفحهٔ رسپی و کارت آن در سایت' },
  { key: 'cover-b', label: 'کاور دوم', description: 'تصویر تکمیلی در گالری رسپی' },
  { key: 'ingredients', label: 'مواد لازم', description: 'تصویر کنار فهرست مواد' },
  { key: 'key-step', label: 'مرحلهٔ کلیدی', description: 'تصویر اول گالری طرز تهیه' },
  { key: 'serving-detail', label: 'آمادهٔ سرو', description: 'تصویر دوم گالری طرز تهیه' },
] as const;

export type RecipePhotoSlot = typeof RECIPE_PHOTO_SLOTS[number]['key'];
export type RecipePhoto = {
  key: string;
  alt: string;
  width: number;
  height: number;
  generated?: boolean;
  caption?: string;
};
export type RecipeFields = {
  title: string;
  intro: string;
  category: string;
  flavor: string;
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
  photos: Partial<Record<RecipePhotoSlot, RecipePhoto>>;
  pageText?: RecipePageText;
  extraSections?: { title: string; text: string }[];
  relatedRecipeSlugs?: string[];
  relatedArticleSlugs?: string[];
};
export type RecipeArticleChoice = { slug: string; title: string; status: 'draft' | 'published'; relatedRecipeSlugs?: string[] };

type RecipeIdentity = {
  slug: string;
  id: number;
  number: string;
  status: 'published' | 'draft';
  hasUnpublishedChanges: boolean;
  updatedAt?: string;
};
export type RecipeSummary = RecipeIdentity & Pick<RecipeFields, 'title' | 'category' | 'flavor'>;
export type RecipeDetail = RecipeIdentity & { draft: RecipeFields; revision: number };
export type RecipeWork = { record: RecipeDetail | null; draft: RecipeFields; slug: string };

// Tab memory keeps work available when navigating back or renewing an expired session.
export const unsavedRecipeWork = new Map<string, RecipeWork>();

export const RECIPE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function emptyRecipe(): RecipeFields {
  return {
    title: '', intro: '', category: '', flavor: '', flavorLabel: '',
    servings: '', timing: '', duration: '', difficulty: '', ingredients: [],
    preparation: '', steps: [], tip: '',
    nutrition: { serving: '', rows: [], note: '' },
    faq: [], seoTitle: '', metaDescription: '', photos: {},
  };
}

export function recipeSummary({ draft, revision: _revision, ...identity }: RecipeDetail): RecipeSummary {
  const { title, category, flavor } = draft;
  return { ...identity, title, category, flavor };
}

export function saveRecipeDraft(token: string, slug: string, draft: RecipeFields, existing: RecipeDetail | null) {
  return apiFetch<RecipeDetail>(existing ? `/recipes/${encodeURIComponent(slug)}` : '/recipes', token, {
    method: existing ? 'PUT' : 'POST',
    body: JSON.stringify(existing ? { draft, expectedRevision: existing.revision } : { slug, draft }),
  });
}

export function changeRecipePublication(token: string, recipe: RecipeDetail, publish: boolean) {
  const action = publish ? 'publish' : 'unpublish';
  return apiFetch<RecipeDetail>(`/recipes/${encodeURIComponent(recipe.slug)}/${action}`, token, {
    method: 'POST',
    body: JSON.stringify({ expectedRevision: recipe.revision }),
  });
}
