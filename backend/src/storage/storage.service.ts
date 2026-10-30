import { CopyObjectCommand, DeleteObjectCommand, PutBucketPolicyCommand, S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
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
    this.publicBaseUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'http://localhost:9000');
    this.s3 = new S3Client({
      endpoint: this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000'),
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
      forcePathStyle: true,
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
      url: `${this.publicBaseUrl}/${this.bucket}/${key}`,
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

  async list(category?: ImageCategory): Promise<ImageEntry[]> {
    const manifest = await this.readManifest();
    return category ? manifest.images.filter((img) => img.category === category) : manifest.images;
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
