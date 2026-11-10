import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { StorageService } from '../storage/storage.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { Article, ARTICLE_CATEGORIES, ARTICLE_CONTENT_FIELDS, ArticleContent, ArticleDocument, ArticleImage } from './schemas/article.schema';

const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const editedElsewhere = () => new ConflictException('این مقاله در نشست دیگری تغییر کرده است. متن ویرایش را نگه دارید و نسخهٔ تازه را باز کنید.');

export function articleWordCount(article: Pick<Article, 'intro' | 'sections' | 'faq'>): number {
  const text = [article.intro, ...article.sections.flatMap(section => section.paragraphs), ...article.faq.flatMap(item => [item.question, item.answer])].join(' ');
  return plain(text).trim().split(/\s+/u).filter(Boolean).length;
}

function contentOf(article: ArticleContent): ArticleContent {
  return Object.fromEntries(ARTICLE_CONTENT_FIELDS.map(field => [field, article[field]])) as ArticleContent;
}

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private readonly articles: Model<ArticleDocument>,
    private readonly storage: StorageService,
  ) {}

  private async get(id: string, version?: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('مقاله پیدا نشد');
    const article = await this.articles.findById(id).exec();
    if (!article) throw new NotFoundException('مقاله پیدا نشد');
    if (version !== undefined && version !== JSON.stringify(article.updatedAt?.toISOString())) throw editedElsewhere();
    return article;
  }

  private adminView<T extends { draftVersion?: Partial<ArticleContent>; publishedUpdatedAt?: Date }>(row: T) {
    const { draftVersion, publishedUpdatedAt: _, ...article } = row;
    return { ...article, ...draftVersion, hasUnpublishedChanges: Boolean(draftVersion) };
  }

  private async validateContent(article: ArticleContent, publishing: boolean) {
    if (!article.title.trim()) throw new BadRequestException('عنوان مقاله را وارد کنید');
    const ids = article.sections.map(section => section.id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('شناسهٔ بخش‌های مقاله باید یکتا باشد');
    const text = [article.intro, ...article.sections.flatMap(section => section.paragraphs), ...article.faq.map(item => item.answer)].join(' ');
    const links = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(match => match[1]);
    if (links.some(href => !/^\/(articles|recipes|flavors)\/[a-z0-9-]+(?:#[a-z0-9-]+)?$/.test(href))) {
      throw new BadRequestException('پیوند داخل متن باید به مقاله، رسپی یا محصول همین سایت باشد');
    }
    const photos = [article.cover, article.bodyImage, ...article.sections.map(section => section.image)]
      .filter((photo): photo is ArticleImage => Boolean(photo));
    if (photos.length) {
      const stored = await this.storage.list(undefined, publishing);
      if (photos.some(photo => !stored.some(image => image.key === photo.key))) {
        throw new BadRequestException(publishing ? 'فایل یکی از تصاویر مقاله در مخزن موجود نیست. تصویر دیگری انتخاب کنید.' : 'تصویر باید از مخزن تصاویر سایت انتخاب شود');
      }
    }

    const wordCount = articleWordCount(article);
    const stats = { wordCount, readingMinutes: Math.max(1, Math.ceil(wordCount / 190)) };
    if (!publishing) return stats;

    if (wordCount < 700 || wordCount > 1500) throw new BadRequestException('متن مقاله برای انتشار باید بین ۷۰۰ تا ۱۵۰۰ کلمه باشد');
    if (!article.cover || !article.excerpt.trim() || !article.intro.trim() || article.sections.length < 3 || !article.sources.length) {
      throw new BadRequestException('برای انتشار، تصویر کاور، خلاصه، مقدمه، حداقل سه بخش و منابع لازم است');
    }
    if (photos.some(photo => !photo.alt.trim())) throw new BadRequestException('برای هر تصویر متن جایگزین وارد کنید');
    if (article.bodyImage && article.bodyImageAfter && !ids.includes(article.bodyImageAfter)) {
      throw new BadRequestException('محل نمایش تصویر داخل مقاله را دوباره انتخاب کنید.');
    }
    if (article.sections.some(section => !section.title.trim() || !section.paragraphs.some(paragraph => paragraph.trim()))) {
      throw new BadRequestException('هر بخش مقاله باید عنوان و دست‌کم یک پاراگراف داشته باشد');
    }
    if (article.sources.some(source => !source.title.trim() || !source.url.trim())) {
      throw new BadRequestException('عنوان و آدرس همهٔ منابع را کامل کنید');
    }
    if (article.faq.some(item => !item.question.trim() || !item.answer.trim())) {
      throw new BadRequestException('پرسش و پاسخ همهٔ موارد را کامل کنید');
    }

    const referenced = [...article.relatedArticleSlugs, ...links.filter(href => href.startsWith('/articles/')).map(href => href.split('/')[2].split('#')[0])];
    const slugs = [...new Set(referenced)].filter(slug => slug !== article.slug);
    if (slugs.length) {
      const found = await this.articles.countDocuments({ slug: { $in: slugs } });
      if (found !== slugs.length) throw new BadRequestException('یکی از مقاله‌های مرتبط وجود ندارد');
    }
    return stats;
  }

  private filterFor(article: ArticleDocument) {
    return { _id: article._id, updatedAt: article.updatedAt ?? { $exists: false } };
  }

  private async commit(article: ArticleDocument, patch: Partial<Article>, clearDraft = false) {
    // Compare the timestamp read before validation so simultaneous edits cannot replace a newer draft.
    const updatedAt = new Date(Math.max(Date.now(), (article.updatedAt?.getTime() ?? 0) + 1));
    const set = { ...patch, updatedAt };
    if (patch.status === 'published') set.publishedUpdatedAt = updatedAt;
    try {
      const updated = await this.articles.findOneAndUpdate(
        this.filterFor(article),
        { $set: set, ...(clearDraft ? { $unset: { draftVersion: 1 } } : {}) },
        { new: true, runValidators: true, timestamps: false },
      ).lean().exec();
      if (!updated) throw editedElsewhere();
      return this.adminView(updated);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictException('این آدرس مقاله قبلاً ثبت شده است');
      throw error;
    }
  }

  async create(dto: CreateArticleDto, actor: string) {
    const article = new this.articles({ ...dto, status: 'draft', createdBy: actor, updatedBy: actor });
    article.set(await this.validateContent(article, false));
    try {
      return this.adminView((await article.save()).toObject());
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictException('این آدرس مقاله قبلاً ثبت شده است');
      throw error;
    }
  }

  async update(id: string, dto: UpdateArticleDto, actor: string, version?: string) {
    const article = await this.get(id, version);
    if (dto.slug && dto.slug !== article.slug && article.publishedAt) {
      throw new BadRequestException('آدرس مقاله‌ای که منتشر شده تغییر نمی‌کند تا پیوندهای آن سالم بمانند');
    }
    const draft = { ...contentOf(article.toObject()), ...article.draftVersion, ...dto };
    draft.title = draft.title.trim();
    const content = { ...draft, ...await this.validateContent(draft, false) };
    if (article.status === 'published') {
      return this.commit(article, {
        draftVersion: content,
        publishedUpdatedAt: article.publishedUpdatedAt ?? article.updatedAt,
        updatedBy: actor,
      });
    }
    return this.commit(article, { ...content, updatedBy: actor });
  }

  async status(id: string, status: 'draft' | 'published', actor: string, version?: string) {
    const article = await this.get(id, version);
    if (status === 'draft') {
      if (article.status === 'draft') return this.adminView(article.toObject());
      return this.commit(article, { ...article.draftVersion, status, updatedBy: actor }, true);
    }
    const draft = { ...contentOf(article.toObject()), ...article.draftVersion };
    const stats = await this.validateContent(draft, true);
    return this.commit(article, { ...draft, ...stats, status, publishedAt: article.publishedAt ?? new Date(), updatedBy: actor }, true);
  }

  async remove(id: string, version?: string) {
    const article = await this.get(id, version);
    if (article.status === 'published') throw new BadRequestException('پیش از حذف، مقاله را به پیش‌نویس برگردانید');
    const result = await this.articles.deleteOne(this.filterFor(article)).exec();
    if (!result.deletedCount) throw editedElsewhere();
    return { deleted: true };
  }

  async adminList(summary = false) {
    const query = this.articles.find().sort({ updatedAt: -1 });
    if (summary) query.select('slug title category status wordCount updatedAt publishedAt cover relatedRecipeSlugs draftVersion.title draftVersion.category draftVersion.wordCount draftVersion.cover');
    const rows = await query.lean().exec();
    return rows.map(row => this.adminView(row));
  }

  async adminOne(id: string) {
    return this.adminView((await this.get(id)).toObject());
  }

  async publicList() {
    const rows = await this.articles.find({ status: 'published', publishedAt: { $lte: new Date() } })
      .select('-sections -faq -sources -createdBy -updatedBy -intro -takeaways -bodyImage -bodyImageAfter -pageText -draftVersion')
      .sort({ publishedAt: 1, _id: 1 }).lean().exec();
    return this.withMedia(rows);
  }

  async publicOne(slug: string) {
    const row = await this.articles.findOne({ slug, status: 'published', publishedAt: { $lte: new Date() } })
      .select('-createdBy -updatedBy -draftVersion').lean().exec();
    if (!row) throw new NotFoundException('مقاله پیدا نشد');
    return (await this.withMedia([row]))[0];
  }

  async categories() {
    const counts = await this.articles.aggregate([{ $match: { status: 'published', publishedAt: { $lte: new Date() } } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
    return ARTICLE_CATEGORIES.map(name => ({ name, count: counts.find(category => category._id === name)?.count ?? 0 }));
  }

  private async withMedia<T extends Pick<Article, 'updatedAt' | 'publishedUpdatedAt'> & Partial<Pick<Article, 'cover' | 'bodyImage' | 'sections'>>>(rows: T[]) {
    const images = await this.storage.list();
    const image = (photo?: ArticleImage | null) => {
      if (!photo) return null;
      const stored = images.find(entry => entry.key === photo.key);
      if (!stored) return null;
      return { key: stored.key, url: stored.url, alt: photo.alt, caption: photo.caption, width: 1536, height: 1024 };
    };
    return rows.map(({ publishedUpdatedAt, sections, ...row }) => ({
      ...row,
      updatedAt: publishedUpdatedAt ?? row.updatedAt,
      cover: image(row.cover),
      ...(row.bodyImage ? { bodyImage: image(row.bodyImage) } : {}),
      ...(sections ? { sections: sections.map(section => ({ ...section, image: image(section.image) })) } : {}),
    }));
  }
}
