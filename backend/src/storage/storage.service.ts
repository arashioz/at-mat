import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, PutBucketCorsCommand, PutBucketPolicyCommand, S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';

export const IMAGE_CATEGORIES = ['products', 'customers', 'branding', 'general'] as const;
export type ImageCategory = (typeof IMAGE_CATEGORIES)[number];

export interface ImageEntry {
  key: string;
  url: string;
  category: ImageCategory;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface Manifest {
  version: number;
  categories: readonly string[];
  images: ImageEntry[];
}

const MANIFEST_PATH = resolve(process.cwd(), '..', 'assets', 'image-manifest.json');

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'at-mat-assets');
    this.publicBaseUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'http://localhost:9000').replace(/\/+$/, '');
    this.s3 = new S3Client({
      endpoint: this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000'),
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
      forcePathStyle: true,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
        secretAccessKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureBucket();
    } catch (err) {
      this.logger.warn(`MinIO در دسترس نیست: ${(err as Error).message}`);
    }
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
    // خواندن عمومی عکس‌ها برای نمایش در پنل ادمین
    await this.s3.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      }),
    );
    try {
      await this.s3.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: ['http://localhost:3002', 'http://127.0.0.1:3002'],
                AllowedMethods: ['GET', 'HEAD'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch {
      this.logger.warn('CORS سطل MinIO روی این نسخه پیاده نشده؛ تصاویر عمومی از مسیر همان‌مبدأ سرو می‌شوند.');
    }
    this.logger.log(`MinIO bucket آماده است: ${this.bucket}`);
  }

  async upload(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    category: ImageCategory,
    uploadedBy: string,
    description?: string,
  ): Promise<ImageEntry> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('فقط فایل تصویری مجاز است');
    }
    const key = `${category}/${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const entry: ImageEntry = {
      key,
      url: this.publicUrl(key),
      category,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      description,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };
    const manifest = await this.readManifest();
    manifest.images.push(entry);
    await this.writeManifest(manifest);
    return entry;
  }

  async list(category?: ImageCategory, availableOnly = false): Promise<ImageEntry[]> {
    const manifest = await this.readManifest();
    const images = category ? manifest.images.filter((img) => img.category === category) : manifest.images;
    if (!images.length) return [];
    const available = availableOnly ? await this.availableKeys(images, category) : null;
    return images.filter(image => !available || available.has(image.key)).map((image) => ({ ...image, url: this.publicUrl(image.key) }));
  }

  private async availableKeys(images: ImageEntry[], category?: ImageCategory) {
    const requested = new Set(images.map(image => image.key));
    const available = new Set<string>();
    try {
      let continuation: string | undefined;
      do {
        const page = await this.s3.send(new ListObjectsV2Command({
          Bucket: this.bucket, Prefix: category ? `${category}/` : undefined, ContinuationToken: continuation,
        }));
        for (const object of page.Contents ?? []) {
          if (object.Key && requested.has(object.Key)) available.add(object.Key);
        }
        continuation = page.NextContinuationToken;
      } while (continuation && available.size < requested.size);
      return available;
    } catch {
      throw new ServiceUnavailableException('مخزن تصاویر در دسترس نیست. دوباره تلاش کنید.');
    }
  }

  private publicUrl(key: string): string {
    return `${this.publicBaseUrl}/${this.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  async remove(key: string): Promise<void> {
    const manifest = await this.readManifest();
    const index = manifest.images.findIndex((img) => img.key === key);
    if (index === -1) {
      throw new NotFoundException('عکس پیدا نشد');
    }
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    manifest.images.splice(index, 1);
    await this.writeManifest(manifest);
  }

  private async readManifest(): Promise<Manifest> {
    try {
      return JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as Manifest;
    } catch {
      return { version: 1, categories: IMAGE_CATEGORIES, images: [] };
    }
  }

  private async writeManifest(manifest: Manifest): Promise<void> {
    await mkdir(dirname(MANIFEST_PATH), { recursive: true });
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  }
}
