import type { RecipeFields } from './recipe.types';

type RecipePublicationSection = 'basics' | 'intro' | 'ingredients' | 'method' | 'extra' | 'nutrition' | 'faq' | 'media' | 'seo';

export function recipePublicationIssues(draft: Omit<RecipeFields, 'flavor'> & { flavor: string }) {
  const { serving, rows } = draft.nutrition;
  const checks: { section: RecipePublicationSection; label: string; done: boolean }[] = [
    { section: 'basics', label: 'عنوان', done: !!draft.title.trim() },
    { section: 'intro', label: 'معرفی', done: !!draft.intro.trim() },
    { section: 'basics', label: 'دسته‌بندی', done: !!draft.category.trim() },
    { section: 'basics', label: 'طعم', done: !!draft.flavor.trim() },
    { section: 'basics', label: 'نام طعم', done: !!draft.flavorLabel.trim() },
    { section: 'intro', label: 'تعداد نفرات', done: !!draft.servings.trim() },
    { section: 'intro', label: 'شرح زمان', done: !!draft.timing.trim() },
    { section: 'intro', label: 'زمان تهیه', done: !!draft.duration.trim() },
    { section: 'intro', label: 'درجهٔ سختی', done: !!draft.difficulty.trim() },
    { section: 'method', label: 'آماده‌سازی تن', done: !!draft.preparation.trim() },
    { section: 'method', label: 'نکتهٔ دستور', done: !!draft.tip.trim() },
    { section: 'seo', label: 'عنوان سئو', done: !!draft.seoTitle.trim() },
    { section: 'seo', label: 'توضیحات سئو', done: !!draft.metaDescription.trim() },
    { section: 'ingredients', label: 'مواد لازم', done: !!draft.ingredients.length && draft.ingredients.every(item => !!item.trim()) },
    { section: 'method', label: 'مراحل تهیه', done: !!draft.steps.length && draft.steps.every(step => !!step.title.trim() && !!step.text.trim()) },
    { section: 'nutrition', label: 'ارزش غذایی', done: !!serving.trim() && !!rows.length && rows.every(row => !!row.name.trim() && !!row.value.trim()) },
    { section: 'faq', label: 'پرسش‌های متداول', done: !!draft.faq.length && draft.faq.every(item => !!item.question.trim() && !!item.answer.trim()) },
    { section: 'media', label: 'تصویر کاور اصلی', done: !!draft.photos['cover-a'] },
    { section: 'media', label: 'متن جایگزین تصاویر', done: Object.values(draft.photos).every(photo => !!photo.alt.trim()) },
    { section: 'extra', label: 'عنوان و متن بخش‌های تکمیلی', done: draft.extraSections?.every(section => !!section.title.trim() && !!section.text.trim()) ?? true },
  ];
  return checks.filter(check => !check.done);
}
