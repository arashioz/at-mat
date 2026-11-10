import { apiFetch } from './api';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002').replace(/\/+$/, '');
export const EDITORIAL_CATEGORIES = ['general', 'products', 'branding'] as const;
export const RASTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MEDIA_ACCEPT = RASTER_TYPES.join(',');

export type MediaCategory = (typeof EDITORIAL_CATEGORIES)[number];
export interface MediaAsset {
  key: string;
  url: string;
  category: MediaCategory;
  originalName: string;
  mimeType: string;
  description?: string;
  uploadedAt: string;
  size: number;
}

export function isEditorialImageKey(key: string) {
  return /^(general|products|branding)\/[a-zA-Z0-9._-]+\.(jpe?g|png|webp)$/i.test(key);
}

export function isRasterType(type: string) {
  return RASTER_TYPES.some(allowed => allowed === type);
}

export const mediaHref = (key: string) => `/media/${key.split('/').map(encodeURIComponent).join('/')}`;

export async function listMedia(token: string): Promise<MediaAsset[]> {
  const images = await apiFetch<MediaAsset[]>('/storage/images?available=1', token);
  return images.filter(image => isEditorialImageKey(image.key) && isRasterType(image.mimeType));
}

export async function uploadMedia(token: string, file: File, category: MediaCategory, description?: string) {
  if (!isRasterType(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new Error('فایل باید JPEG، PNG یا WebP باشد.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
  const form = new FormData();
  form.set('file', file);
  form.set('category', category);
  if (description?.trim()) form.set('description', description.trim());
  return apiFetch<MediaAsset>('/storage/images', token, { method: 'POST', body: form });
}

export function photoDimensions(file: File): Promise<{ width: number; height: number }> {
  const source = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(source);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error('این فایل به‌عنوان تصویر خوانده نشد.'));
    };
    image.src = source;
  });
}
