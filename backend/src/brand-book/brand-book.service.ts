import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import { StorageService } from '../storage/storage.service';
import { BRAND_CHAPTERS, BRAND_COVER, BRAND_SOURCES, BrandBookContent, BrandChapter, BrandReference } from './brand-book.content';
import { BRAND_IMAGE_KEY, UpdateBrandBookDto } from './brand-book.dto';
import { answerFromBrandBook } from './brand-book-search';

type SavedBook = BrandBookContent & { _id: string; revision: number; updatedAt: Date };
const sectionSchema = new Schema<BrandChapter['sections'][number]>({
  title: String, body: String,
}, { _id: false });
const referenceSchema = new Schema<BrandReference>({
  source: String, location: String,
}, { _id: false });
const chapterSchema = new Schema<BrandChapter>({
  id: String, title: String, summary: String, sections: [sectionSchema], references: [referenceSchema],
}, { _id: false });
const captionSchema = new Schema<BrandBookContent['assetCaptions'][number]>({
  key: String, caption: String,
}, { _id: false });

const coverSchema = new Schema<BrandBookContent['cover']>({ title: String, tagline: String }, { _id: false });

export const BrandBookSchema = new Schema<SavedBook>({
  _id: String,
  cover: coverSchema,
  chapters: { type: [chapterSchema], required: true },
  assetCaptions: { type: [captionSchema], default: [] },
  revision: { type: Number, required: true },
  updatedAt: { type: Date, required: true },
}, { versionKey: false });

const BOOK_ID = 'at-mat';
const stale = () => new ConflictException('برند بوک در نشست دیگری تغییر کرده است. نسخهٔ تازه را باز کنید.');
const RASTER = new Set(['image/jpeg', 'image/png', 'image/webp']);

@Injectable()
export class BrandBookService {
  constructor(
    @InjectModel('BrandBook') private readonly books: Model<SavedBook>,
    private readonly storage: StorageService,
  ) {}

  async get() {
    const saved = await this.books.findById(BOOK_ID).lean().exec();
    return {
      cover: saved?.cover ?? BRAND_COVER,
      chapters: saved?.chapters ?? BRAND_CHAPTERS,
      assetCaptions: saved?.assetCaptions ?? [],
      revision: saved?.revision ?? 0,
      updatedAt: saved?.updatedAt ?? null,
      sources: BRAND_SOURCES.map(({ id, title, label, detail }) => ({ id, title, label, detail })),
    };
  }

  async assets() {
    const all = await this.storage.list(undefined, true);
    return all.filter(image => BRAND_IMAGE_KEY.test(image.key) && RASTER.has(image.mimeType) &&
      (image.category === 'branding' || (image.category === 'products' &&
        /^(brine|sunflower|olive-oil|pepper|smoked|dill)-(label|lid|idea)/.test(image.description ?? ''))));
  }

  async update(dto: UpdateBrandBookDto) {
    const ids = dto.chapters.map(chapter => chapter.id);
    const keys = dto.assetCaptions.map(asset => asset.key);
    if (new Set(ids).size !== ids.length || ids.some(id => id === 'assets' || id === 'sources') || new Set(keys).size !== keys.length) {
      throw new BadRequestException('شناسهٔ فصل‌ها و تصاویر باید یکتا باشد.');
    }
    const content = { cover: dto.cover, chapters: dto.chapters, assetCaptions: dto.assetCaptions, updatedAt: new Date(), revision: dto.revision + 1 };
    try {
      const saved = await this.books.findOneAndUpdate(
        { _id: BOOK_ID, revision: dto.revision },
        { $set: content },
        { new: true, upsert: dto.revision === 0 },
      ).lean().exec();
      if (!saved) throw stale();
      return { revision: saved.revision, updatedAt: saved.updatedAt };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw stale();
      throw error;
    }
  }

  async ask(question: string) {
    const { chapters } = await this.get();
    return { matches: answerFromBrandBook(chapters, question) };
  }
}
