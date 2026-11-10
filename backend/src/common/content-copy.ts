export const articleCopy = {
  startReading: 'شروع خوندن',
  takeawaysLabel: 'پیش از شروع',
  takeawaysTitle: 'چیزهایی که می‌دونیم.',
  questionsTitle: 'پرسش‌های رایج',
  sourcesTitle: 'منابع این مقاله',
  sourcesNote: 'محتوای آموزشی عمومی است. برای برنامه غذایی یا شرایط پزشکی فردی، از متخصص راهنمایی بگیرید. تصاویر، تصویرسازی‌اند و مستندات تولید یا تأمین ات‌مت نیستند.',
  productsTitle: 'از روی بسته بخونیم',
  relatedRecipesLabel: 'یک قدم تا سفره',
  relatedRecipesTitle: 'باهاش چی بپزیم؟',
  relatedArticlesTitle: 'ادامهٔ این ماجرا.',
};

export const recipeCopy = {
  startCooking: 'بریم سراغ مواد',
  ingredientsLabel: 'مواد لازم',
  ingredientsTitle: 'چی لازم داریم؟',
  methodLabel: 'طرز تهیه',
  methodTitle: 'دست‌به‌کار\nشویم.',
  preparationTitle: 'اول، آماده‌سازی تن',
  tipLabel: 'فوت آخر',
  tipTitle: 'برای خوش‌مزه‌تر شدن.',
  extraTitle: 'نکته‌های تکمیلی',
  nutritionLabel: 'در هر وعده',
  nutritionTitle: 'ارزش غذایی،\nدر یک نگاه.',
  nutritionIntro: 'این مقادیر تخمینی‌اند.',
  nutritionOutro: 'مقدار واقعی با برند مواد و روغن باقی‌مانده تغییر می‌کند.',
  questionsLabel: 'پرسش‌های متداول',
  questionsTitle: 'قبل از\nاولین لقمه.',
  relatedRecipesTitle: 'دفعهٔ بعد،\nاین‌ها را امتحان کن.',
  relatedArticlesLabel: 'کنار آشپزی، بیشتر بدونیم',
  relatedArticlesTitle: 'از مجلهٔ ات‌مت.',
};

export const recipeGalleryCaptions = {
  'key-step': 'در آشپزخانه',
  'serving-detail': 'آمادهٔ سرو',
  'cover-b': 'تصویر تکمیلی',
};

type CopyOverrides<Defaults> = Partial<Record<keyof Defaults, string>>;
export type ArticlePageText = CopyOverrides<typeof articleCopy>;
export type RecipePageText = CopyOverrides<typeof recipeCopy>;

export const PAGE_TEXT_MAX_LENGTH = 1000;

export function resolvePageText<Defaults extends Record<string, string>>(defaults: Defaults, overrides?: CopyOverrides<Defaults>) {
  const copy = { ...defaults } as Record<keyof Defaults, string>;
  for (const key of Object.keys(defaults) as (keyof Defaults)[]) {
    const override = overrides?.[key]?.trim();
    if (override) copy[key] = override;
  }
  return copy;
}
