import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { StorageService } from '../storage/storage.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { Article, ARTICLE_CATEGORIES, ArticleDocument } from './schemas/article.schema';

const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
export function articleWordCount(article: Pick<Article, 'intro' | 'sections' | 'faq'>): number {
  return plain([article.intro, ...article.sections.flatMap(s => s.paragraphs), ...article.faq.flatMap(q => [q.question, q.answer])].join(' ')).trim().split(/\s+/u).filter(Boolean).length;
}
@Injectable()
export class ArticlesService {
  constructor(@InjectModel(Article.name) private readonly articles: Model<ArticleDocument>, private readonly storage: StorageService) {}

  private async get(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('مقاله پیدا نشد');
    const item = await this.articles.findById(id).exec();
    if (!item) throw new NotFoundException('مقاله پیدا نشد');
    return item;
  }
  private async validateContent(article: Article, publishing: boolean) {
    const ids = article.sections.map(s => s.id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('شناسهٔ بخش‌های مقاله باید یکتا باشد');
    const text = [article.intro, ...article.sections.flatMap(s => s.paragraphs), ...article.faq.map(q => q.answer)].join(' ');
    const links = [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(m => m[1]);
    if (links.some(href => !/^\/(articles|recipes|flavors)\/[a-z0-9-]+(?:#[a-z0-9-]+)?$/.test(href))) throw new BadRequestException('پیوند داخل متن باید به مقاله، رسپی یا محصول همین سایت باشد');
    const stored = await this.storage.list();
    for (const photo of [article.cover, article.bodyImage]) {
      if (photo && !stored.some(x => x.key === photo.key)) throw new BadRequestException('تصویر باید از طریق مخزن تصاویر سایت آپلود شده باشد');
    }
    article.wordCount = articleWordCount(article);
    article.readingMinutes = Math.max(1, Math.ceil(article.wordCount / 190));
    if (!publishing) return;
    if (article.wordCount < 700 || article.wordCount > 1500) throw new BadRequestException('متن مقاله برای انتشار باید بین ۷۰۰ تا ۱۵۰۰ کلمه باشد');
    if (!article.cover || !article.excerpt.trim() || !article.intro.trim() || article.sections.length < 3 || !article.sources.length) throw new BadRequestException('برای انتشار، تصویر کاور، خلاصه، مقدمه، حداقل سه بخش و منابع لازم است');
    const referenced = [...article.relatedArticleSlugs, ...links.filter(x => x.startsWith('/articles/')).map(x => x.split('/')[2].split('#')[0])].filter(x => x !== article.slug);
    if (referenced.length) {
      const found = await this.articles.countDocuments({ slug: { $in: [...new Set(referenced)] } });
      if (found !== new Set(referenced).size) throw new BadRequestException('یکی از مقاله‌های مرتبط وجود ندارد');
    }
  }
  async create(dto: CreateArticleDto, actor: string) {
    const article = new this.articles({ ...dto, status: 'draft', createdBy: actor, updatedBy: actor });
    await this.validateContent(article, false);
    try { return await article.save(); } catch (error) { if ((error as { code?: number }).code === 11000) throw new ConflictException('این آدرس مقاله قبلاً ثبت شده است'); throw error; }
  }
  async update(id: string, dto: UpdateArticleDto, actor: string) {
    const article = await this.get(id);
    if (dto.slug && dto.slug !== article.slug && article.publishedAt) throw new BadRequestException('آدرس مقاله‌ای که منتشر شده تغییر نمی‌کند تا پیوندهای آن سالم بمانند');
    article.set({ ...dto, updatedBy: actor });
    await this.validateContent(article, article.status === 'published');
    try { return await article.save(); } catch (error) { if ((error as { code?: number }).code === 11000) throw new ConflictException('این آدرس مقاله قبلاً ثبت شده است'); throw error; }
  }
  async status(id: string, status: 'draft' | 'published', actor: string) {
    const article = await this.get(id);
    await this.validateContent(article, status === 'published');
    article.status = status; article.updatedBy = actor;
    if (status === 'published' && !article.publishedAt) article.publishedAt = new Date();
    return article.save();
  }
  async remove(id: string) {
    const article = await this.get(id);
    if (article.status === 'published') throw new BadRequestException('پیش از حذف، مقاله را به پیش‌نویس برگردانید');
    await article.deleteOne(); return { deleted: true };
  }
  adminList() { return this.articles.find().sort({ updatedAt: -1 }).exec(); }
  adminOne(id: string) { return this.get(id); }
  async publicList() {
    const rows = await this.articles.find({ status: 'published', publishedAt: { $lte: new Date() } }).select('-sections -faq -sources -createdBy -updatedBy -intro -takeaways -bodyImage').sort({ publishedAt: 1, _id: 1 }).lean().exec();
    return this.withMedia(rows);
  }
  async publicOne(slug: string) {
    const row = await this.articles.findOne({ slug, status: 'published', publishedAt: { $lte: new Date() } }).select('-createdBy -updatedBy').lean().exec();
    if (!row) throw new NotFoundException('مقاله پیدا نشد');
    return (await this.withMedia([row]))[0];
  }
  async categories() {
    const counts = await this.articles.aggregate([{ $match: { status: 'published', publishedAt: { $lte: new Date() } } }, { $group: { _id: '$category', count: { $sum: 1 } } }]);
    return ARTICLE_CATEGORIES.map(name => ({ name, count: counts.find(c => c._id === name)?.count ?? 0 }));
  }
  private async withMedia<T extends { cover?: { key: string; alt: string } | null; bodyImage?: { key: string; alt: string } | null }>(rows: T[]) {
    const images = await this.storage.list();
    const image = (photo: T['cover']) => {
      if (!photo) return null;
      const stored = images.find(x => x.key === photo.key);
      if (!stored) return null;
      return { key: stored.key, url: stored.url, alt: photo.alt, width: 1536, height: 1024 };
    };
    return rows.map(row => ({ ...row, cover: image(row.cover), ...(row.bodyImage ? { bodyImage: image(row.bodyImage) } : {}) }));
  }
}
