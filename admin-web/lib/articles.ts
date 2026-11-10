import type { ArticlePageText } from '../../backend/src/common/content-copy';

export { articleCategories } from '../../web/src/features/articles/types';
export { SITE_URL as siteOrigin } from './media';

export type ArticlePhoto = { key: string; alt: string; caption?: string };
export type ArticleSection = { id: string; title: string; paragraphs: string[]; image?: ArticlePhoto | null };
export type ArticleQuestion = { question: string; answer: string };
export type ArticleSource = { title: string; url: string };
export type ArticleStatus = 'draft' | 'published';
export type ArticleTab = 'details' | 'intro' | 'body' | 'media' | 'faq' | 'sources' | 'seo' | 'relations';
export type ArticleMediaTarget = 'cover' | 'bodyImage' | { sectionIndex: number };

export interface ArticleFields {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  intro: string;
  author: string;
  seoTitle: string;
  metaDescription: string;
  tags: string[];
  takeaways: string[];
  sections: ArticleSection[];
  faq: ArticleQuestion[];
  sources: ArticleSource[];
  cover: ArticlePhoto | null;
  bodyImage: ArticlePhoto | null;
  bodyImageAfter: string;
  pageText: ArticlePageText;
  relatedArticleSlugs: string[];
  relatedRecipeSlugs: string[];
  productSlugs: string[];
}

export interface ArticleSummary {
  _id: string;
  slug: string;
  title: string;
  category: string;
  cover: ArticlePhoto | null;
  status: ArticleStatus;
  wordCount: number;
  updatedAt: string;
  publishedAt?: string;
  hasUnpublishedChanges: boolean;
}

export type ArticleRecord = ArticleSummary & ArticleFields;
export type RecipeChoice = { slug: string; title: string; status: ArticleStatus };

export const productChoices = [
  { slug: 'brine', title: 'آب‌نمک' },
  { slug: 'sunflower', title: 'روغن آفتابگردان' },
  { slug: 'olive-oil', title: 'روغن زیتون' },
  { slug: 'pepper', title: 'فلفلی' },
  { slug: 'smoked', title: 'دودی' },
  { slug: 'dill', title: 'شوید' },
] as const;

export const formatNumber = (value: number) => value.toLocaleString('fa-IR');
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sectionContent = (section: ArticleSection) => section.title.trim() && section.paragraphs.some(paragraph => paragraph.trim());

export function blankArticle(): ArticleFields {
  return {
    slug: '', title: '', category: 'تغذیه', excerpt: '', intro: '', author: 'تحریریهٔ ات‌مت',
    seoTitle: '', metaDescription: '', tags: [], takeaways: [], sections: [], faq: [], sources: [],
    cover: null, bodyImage: null, bodyImageAfter: '', pageText: {},
    relatedArticleSlugs: [], relatedRecipeSlugs: [], productSlugs: [],
  };
}

export function editableArticle(record: ArticleRecord): ArticleFields {
  const defaults = blankArticle();
  const keys = Object.keys(defaults) as Array<keyof ArticleFields>;
  const fields = Object.fromEntries(keys.map(key => [key, record[key] ?? defaults[key]])) as unknown as ArticleFields;
  fields.bodyImageAfter = record.bodyImageAfter ?? fields.sections[1]?.id ?? '';
  return fields;
}

export function articleWordCount(fields: ArticleFields) {
  const text = [
    fields.intro,
    ...fields.sections.flatMap(section => section.paragraphs),
    ...fields.faq.flatMap(item => [item.question, item.answer]),
  ].join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function publishChecklist(fields: ArticleFields, words: number, allowEmptySlug = false) {
  const checks: { done: boolean; label: string; section: ArticleTab }[] = [
    {
      done: !!fields.title.trim() && (slugPattern.test(fields.slug.trim()) || (allowEmptySlug && !fields.slug.trim())),
      label: 'عنوان و نشانی مقاله', section: 'details',
    },
    { done: !!fields.excerpt.trim(), label: 'خلاصهٔ کارت', section: 'details' },
    { done: !!fields.intro.trim(), label: 'مقدمه', section: 'intro' },
    { done: words >= 700 && words <= 1500, label: '۷۰۰ تا ۱۵۰۰ کلمه', section: 'body' },
    { done: fields.sections.length >= 3 && fields.sections.every(sectionContent), label: 'دست‌کم سه بخش کامل', section: 'body' },
    {
      done: !!fields.cover?.alt.trim() && (!fields.bodyImage || !!fields.bodyImage.alt.trim()) &&
        fields.sections.every(section => !section.image || !!section.image.alt.trim()),
      label: 'کاور و متن جایگزین همهٔ تصاویر', section: 'media',
    },
    { done: fields.sources.length > 0 && fields.sources.every(source => source.title.trim() && source.url.trim()), label: 'منابع کامل', section: 'sources' },
    { done: fields.faq.every(item => item.question.trim() && item.answer.trim()), label: 'تکمیل پرسش و پاسخ‌ها', section: 'faq' },
  ];
  return checks.filter(item => !item.done);
}

export function articleStatus(item: Pick<ArticleSummary, 'status' | 'hasUnpublishedChanges'>) {
  if (item.hasUnpublishedChanges) return 'تغییرات در پیش‌نویس';
  return item.status === 'published' ? 'منتشرشده' : 'پیش‌نویس';
}

export function normalizeSearch(value: string) {
  return value.toLowerCase().replaceAll('ي', 'ی').replaceAll('ك', 'ک').replace(/[\s‌]+/g, ' ').trim();
}
