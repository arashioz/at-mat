import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongoSchema } from 'mongoose';
import type { ArticlePageText } from '../../common/content-copy';

export const ARTICLE_CATEGORIES = ['تغذیه', 'سلامتی', 'هلث فود و سبک زندگی', 'ورزش', 'دنیای آبزیان'] as const;
export interface ArticleSection { id: string; title: string; paragraphs: string[]; image?: ArticleImage | null }
export interface ArticleImage { key: string; alt: string; caption?: string }
export interface ArticleSource { title: string; url: string }

export const ARTICLE_CONTENT_FIELDS = [
  'slug', 'title', 'excerpt', 'intro', 'category', 'tags', 'author', 'seoTitle', 'metaDescription',
  'sections', 'faq', 'sources', 'takeaways', 'cover', 'bodyImage', 'bodyImageAfter', 'pageText', 'relatedArticleSlugs',
  'relatedRecipeSlugs', 'productSlugs', 'wordCount', 'readingMinutes',
] as const;
export type ArticleContent = Pick<Article, typeof ARTICLE_CONTENT_FIELDS[number]>;
const imageFields = { _id: false, key: String, alt: String, caption: String };

@Schema({ timestamps: true, versionKey: false })
export class Article {
  @Prop({ required: true, unique: true, trim: true, index: true }) slug: string;
  @Prop({ required: true, trim: true }) title: string;
  @Prop({ default: '' }) excerpt: string;
  @Prop({ default: '' }) intro: string;
  @Prop({ required: true, enum: ARTICLE_CATEGORIES, index: true }) category: string;
  @Prop({ type: [String], default: [] }) tags: string[];
  @Prop({ default: 'تحریریهٔ ات‌مت' }) author: string;
  @Prop({ default: '' }) seoTitle: string;
  @Prop({ default: '' }) metaDescription: string;
  @Prop({
    type: [{ _id: false, id: String, title: String, paragraphs: [String], image: { type: imageFields, default: undefined } }],
    default: [],
  }) sections: ArticleSection[];
  @Prop({ type: [{ _id: false, question: String, answer: String }], default: [] }) faq: { question: string; answer: string }[];
  @Prop({ type: [{ _id: false, title: String, url: String }], default: [] }) sources: ArticleSource[];
  @Prop({ type: [String], default: [] }) takeaways: string[];
  @Prop({ type: imageFields, default: null }) cover: ArticleImage | null;
  @Prop({ type: imageFields, default: null }) bodyImage: ArticleImage | null;
  @Prop({ type: String }) bodyImageAfter?: string;
  @Prop({ type: MongoSchema.Types.Mixed }) pageText?: ArticlePageText;
  @Prop({ type: [String], default: [] }) relatedArticleSlugs: string[];
  @Prop({ type: [String], default: [] }) relatedRecipeSlugs: string[];
  @Prop({ type: [String], default: [] }) productSlugs: string[];
  @Prop({ enum: ['draft', 'published'], default: 'draft', index: true }) status: 'draft' | 'published';
  @Prop({ default: 0 }) wordCount: number;
  @Prop({ default: 1 }) readingMinutes: number;
  @Prop({ type: Date }) publishedAt?: Date;
  @Prop({ type: Date }) publishedUpdatedAt?: Date;
  @Prop({ type: MongoSchema.Types.Mixed }) draftVersion?: ArticleContent;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User' }) createdBy?: string;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User' }) updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
export type ArticleDocument = HydratedDocument<Article>;
export const ArticleSchema = SchemaFactory.createForClass(Article);
ArticleSchema.index({ status: 1, publishedAt: -1 });
