import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { Error as MongooseError, Model } from 'mongoose';
import { ImageEntry, StorageService } from '../storage/storage.service';
import { CreateRecipeDto, RecipeFieldsDto, SaveRecipeDraftDto } from './dto/recipe.dto';
import {
  PublishedRecipe,
  RECIPE_IMAGE_KEY,
  RECIPE_PHOTO_SLOTS,
  RECIPE_SLUG,
  RecipeDetail,
  RecipeFields,
  RecipeSummary,
  SourceRecipe,
} from './recipe.types';
import { recipePublicationIssues } from './recipe-publication';
import { RecipeOverlay, RecipeOverlayDocument } from './schemas/recipe-overlay.schema';

const SOURCE_PATH = resolve(__dirname, '../../../web/src/features/recipes/content.json');
const PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']);
const recipeNumber = new Intl.NumberFormat('fa-IR', { minimumIntegerDigits: 2, useGrouping: false });

function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 11000;
}

function normalizeDraft(input: RecipeFieldsDto): RecipeFields {
  const photos: RecipeFields['photos'] = {};
  for (const slot of RECIPE_PHOTO_SLOTS) {
    const photo = input.photos?.[slot];
    if (!photo) continue;
    photos[slot] = {
      key: photo.key,
      alt: photo.alt ?? '',
      width: photo.width,
      height: photo.height,
      ...(typeof photo.generated === 'boolean' ? { generated: photo.generated } : {}),
      ...(typeof photo.caption === 'string' ? { caption: photo.caption } : {}),
    };
  }
  return {
    title: input.title ?? '',
    intro: input.intro ?? '',
    category: input.category ?? '',
    flavor: input.flavor ?? '',
    flavorLabel: input.flavorLabel ?? '',
    servings: input.servings ?? '',
    timing: input.timing ?? '',
    duration: input.duration ?? '',
    difficulty: input.difficulty ?? '',
    ingredients: input.ingredients ?? [],
    preparation: input.preparation ?? '',
    steps: (input.steps ?? []).map(step => ({ title: step.title ?? '', text: step.text ?? '' })),
    tip: input.tip ?? '',
    nutrition: {
      serving: input.nutrition?.serving ?? '',
      rows: (input.nutrition?.rows ?? []).map(row => ({ name: row.name ?? '', value: row.value ?? '' })),
      note: input.nutrition?.note ?? '',
    },
    faq: (input.faq ?? []).map(item => ({ question: item.question ?? '', answer: item.answer ?? '' })),
    seoTitle: input.seoTitle ?? '',
    metaDescription: input.metaDescription ?? '',
    photos,
    ...(input.pageText ? { pageText: { ...input.pageText } } : {}),
    ...(input.extraSections ? { extraSections: input.extraSections.map(section => ({ title: section.title, text: section.text })) } : {}),
    ...(input.relatedRecipeSlugs ? { relatedRecipeSlugs: input.relatedRecipeSlugs } : {}),
    ...(input.relatedArticleSlugs ? { relatedArticleSlugs: input.relatedArticleSlugs } : {}),
  };
}

function sourceRecipe(source: SourceRecipe, images: Map<string, ImageEntry>): PublishedRecipe {
  const { photos: sourcePhotos, ...fields } = source;
  const photos: RecipeFields['photos'] = {};
  for (const slot of RECIPE_PHOTO_SLOTS) {
    const photo = sourcePhotos[slot];
    if (!photo) continue;
    const { description, ...attributes } = photo;
    const entry = images.get(description);
    if (entry) photos[slot] = { key: entry.key, ...attributes };
  }
  return { ...fields, photos };
}

function overlaySummary(row: RecipeOverlay): RecipeSummary {
  return {
    id: row.id,
    number: row.number,
    slug: row.slug,
    title: row.draft.title,
    category: row.draft.category,
    flavor: row.draft.flavor,
    status: row.published ? 'published' : 'draft',
    hasUnpublishedChanges: !!row.published && !isDeepStrictEqual(row.draft, row.published),
    ...(row.updatedAt ? { updatedAt: row.updatedAt.toISOString() } : {}),
  };
}

@Injectable()
export class RecipesService implements OnModuleInit {
  private source?: SourceRecipe[];

  constructor(
    @InjectModel(RecipeOverlay.name) private readonly recipes: Model<RecipeOverlay>,
    private readonly storage: StorageService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.recipes.init();
  }

  async adminList(): Promise<RecipeSummary[]> {
    const [source, overlays] = await Promise.all([this.readSource(), this.recipes.find().lean().exec()]);
    const overrides = new Map(overlays.map(row => [row.slug, overlaySummary(row)]));
    const originals = source.filter(recipe => !overrides.has(recipe.slug)).map(({ id, number, slug, title, category, flavor }) => ({
      id, number, slug, title, category, flavor, status: 'published' as const, hasUnpublishedChanges: false,
    }));
    return [...originals, ...overrides.values()].sort((first, second) => first.id - second.id);
  }

  async adminOne(slug: string): Promise<RecipeDetail> {
    return this.detail(await this.editable(slug));
  }

  async create(dto: CreateRecipeDto): Promise<RecipeDetail> {
    const source = await this.readSource();
    if (source.some(item => item.slug === dto.slug)) throw new ConflictException('این آدرس رسپی قبلاً ثبت شده است.');

    const draft = normalizeDraft(dto.draft);
    await this.validatePhotos(draft);
    const lastSourceId = Math.max(0, ...source.map(item => item.id));

    // A unique id lets simultaneous creations retry safely without replacing another recipe.
    for (let attempt = 0; attempt < 5; attempt++) {
      const last = await this.recipes.findOne().sort({ id: -1 }).select('id').lean().exec();
      const id = Math.max(lastSourceId, last?.id ?? 0) + 1;
      try {
        const row = await this.recipes.create({ id, number: recipeNumber.format(id), slug: dto.slug, draft });
        return this.detail(row);
      } catch (error) {
        if (!isDuplicateKey(error)) throw error;
        if (await this.recipes.exists({ slug: dto.slug })) throw new ConflictException('این آدرس رسپی قبلاً ثبت شده است.');
      }
    }
    throw new ConflictException('ثبت هم‌زمان چند رسپی انجام شد. دوباره تلاش کنید.');
  }

  async saveDraft(slug: string, dto: SaveRecipeDraftDto): Promise<RecipeDetail> {
    const row = await this.editable(slug, dto.expectedRevision);
    const draft = normalizeDraft(dto.draft);
    await this.validatePhotos(draft);
    if (isDeepStrictEqual(row.draft, draft)) return this.detail(row);
    row.draft = draft;
    return this.save(row);
  }

  async publish(slug: string, expectedRevision?: number | null): Promise<RecipeDetail> {
    const row = await this.editable(slug, expectedRevision);
    const missing = recipePublicationIssues(row.draft);
    if (missing.length) {
      throw new BadRequestException(`برای انتشار، ${missing.map(issue => issue.label).join('، ')} را کامل کنید.`);
    }
    await this.validatePhotos(row.draft, true);
    if (isDeepStrictEqual(row.published, row.draft)) return this.detail(row);
    row.published = row.draft;
    return this.save(row);
  }

  async unpublish(slug: string, expectedRevision?: number | null): Promise<RecipeDetail> {
    const row = await this.editable(slug, expectedRevision);
    if (!row.published) return this.detail(row);
    row.published = null;
    return this.save(row);
  }

  async publicList(): Promise<PublishedRecipe[]> {
    const [source, overlays, images] = await Promise.all([
      this.readSource(),
      this.recipes.find().select('slug id number published').lean().exec(),
      this.imagesByDescription(),
    ]);
    const slugsWithOverlays = new Set(overlays.map(row => row.slug));
    const originals = source.filter(item => !slugsWithOverlays.has(item.slug)).map(item => sourceRecipe(item, images));
    const published = overlays.flatMap(({ slug, id, number, published }) => published ? [{ slug, id, number, ...published }] : []);
    return [...originals, ...published].sort((first, second) => first.id - second.id);
  }

  async publicOne(slug: string): Promise<PublishedRecipe> {
    this.checkSlug(slug);
    const row = await this.recipes.findOne({ slug }).select('slug id number published').lean().exec();
    if (row) {
      if (!row.published) throw new NotFoundException('رسپی پیدا نشد.');
      return { slug: row.slug, id: row.id, number: row.number, ...row.published };
    }
    return sourceRecipe(await this.original(slug), await this.imagesByDescription());
  }

  private async readSource(): Promise<SourceRecipe[]> {
    this.source ??= JSON.parse(await readFile(SOURCE_PATH, 'utf8')) as SourceRecipe[];
    return this.source;
  }

  private async original(slug: string): Promise<SourceRecipe> {
    const recipe = (await this.readSource()).find(item => item.slug === slug);
    if (!recipe) throw new NotFoundException('رسپی پیدا نشد.');
    return recipe;
  }

  private async registeredImages(availableOnly = false): Promise<ImageEntry[]> {
    return (await this.storage.list(undefined, availableOnly)).filter(entry => RECIPE_IMAGE_KEY.test(entry.key) && PHOTO_TYPES.has(entry.mimeType));
  }

  private async imagesByDescription(): Promise<Map<string, ImageEntry>> {
    const images = new Map<string, ImageEntry>();
    for (const entry of await this.registeredImages()) {
      if (entry.description) images.set(entry.description, entry);
    }
    return images;
  }

  private async validatePhotos(fields: RecipeFields, availableOnly = false): Promise<void> {
    const photos = Object.values(fields.photos);
    if (!photos.length) return;
    const keys = new Set((await this.registeredImages(availableOnly)).map(image => image.key));
    if (photos.some(photo => !keys.has(photo.key))) {
      throw new BadRequestException(availableOnly ? 'فایل یکی از تصاویر رسپی در مخزن موجود نیست. تصویر دیگری انتخاب کنید.' : 'تصاویر رسپی را از مخزن تصاویر سایت انتخاب کنید.');
    }
  }

  private checkSlug(slug: string): void {
    if (slug.length > 90 || !RECIPE_SLUG.test(slug)) throw new NotFoundException('رسپی پیدا نشد.');
  }

  private async editable(slug: string, expectedRevision?: number | null): Promise<RecipeOverlayDocument> {
    this.checkSlug(slug);
    const row = await this.recipes.findOne({ slug }).exec();
    if (expectedRevision != null && expectedRevision !== (row ? row.version + 1 : 0)) this.conflict();
    if (row) return row;

    const { id, number, slug: sourceSlug, ...draft } = sourceRecipe(await this.original(slug), await this.imagesByDescription());
    return new this.recipes({ id, number, slug: sourceSlug, draft, published: draft });
  }

  private detail(row: RecipeOverlayDocument): RecipeDetail {
    const { id, number, slug, status, hasUnpublishedChanges, updatedAt } = overlaySummary(row);
    return { id, number, slug, status, hasUnpublishedChanges, updatedAt, revision: row.isNew ? 0 : row.version + 1, draft: row.draft };
  }

  private async save(row: RecipeOverlayDocument): Promise<RecipeDetail> {
    try {
      return this.detail(await row.save());
    } catch (error) {
      if (error instanceof MongooseError.VersionError || isDuplicateKey(error)) this.conflict();
      throw error;
    }
  }

  private conflict(): never {
    throw new ConflictException('این رسپی تغییر کرده است. آخرین نسخه را دوباره باز کنید.');
  }
}
