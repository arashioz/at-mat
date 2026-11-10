import type { ArticlePageText } from '../../../../backend/src/common/content-copy';

export const articleCategories = ['تغذیه', 'سلامتی', 'هلث فود و سبک زندگی', 'ورزش', 'دنیای آبزیان'];
export interface ArticlePhoto { key: string; url: string; alt: string; width: number; height: number; caption?: string }
export interface ArticleCardData {
  _id: string; slug: string; title: string; excerpt: string; category: string; tags: string[]; author: string;
  seoTitle: string; metaDescription: string; cover: ArticlePhoto | null; wordCount: number; readingMinutes: number;
  publishedAt: string; updatedAt: string; relatedArticleSlugs: string[]; relatedRecipeSlugs: string[]; productSlugs: string[];
}
export interface Article extends ArticleCardData {
  intro: string; sections: { id: string; title: string; paragraphs: string[]; image?: ArticlePhoto | null }[];
  takeaways: string[]; bodyImage: ArticlePhoto | null;
  bodyImageAfter?: string; pageText?: ArticlePageText;
  faq: { question: string; answer: string }[]; sources: { title: string; url: string }[];
}
