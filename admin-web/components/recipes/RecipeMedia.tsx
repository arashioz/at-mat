import { useState } from 'react';
import { MEDIA_ACCEPT, mediaHref, photoDimensions, uploadMedia, type MediaAsset } from '../../lib/media';
import { RECIPE_PHOTO_SLOTS, type RecipeFields, type RecipePhoto, type RecipePhotoSlot } from '../../lib/recipes';
import { CmsMediaPicker } from '../CmsMediaPicker';
import { useAdminWorkspace } from '../AppShell';
import { RecipeTextField } from './RecipeFields';
import { recipeGalleryCaptions } from '../../../backend/src/common/content-copy';

function readDimensions(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('این تصویر در کتابخانه در دسترس نیست.'));
    image.src = src;
  });
}

function assertDimensions({ width, height }: { width: number; height: number }) {
  if (width < 1 || height < 1 || width > 20000 || height > 20000) {
    throw new Error('طول و عرض تصویر باید بین ۱ تا ۲۰٬۰۰۰ پیکسل باشد.');
  }
}

export function RecipeMedia({
  photos, title, onChange, onBusyChange,
}: {
  photos: RecipeFields['photos'];
  title: string;
  onChange: (slot: RecipePhotoSlot, photo: RecipePhoto | null) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { token } = useAdminWorkspace();
  const [slot, setSlot] = useState<RecipePhotoSlot | null>(null);
  const [busySlot, setBusySlot] = useState<RecipePhotoSlot | null>(null);
  const [error, setError] = useState('');

  async function choose(photoSlot: RecipePhotoSlot, asset: MediaAsset) {
    setBusySlot(photoSlot);
    onBusyChange(true);
    try {
      const size = await readDimensions(mediaHref(asset.key));
      assertDimensions(size);
      onChange(photoSlot, { key: asset.key, alt: '', ...size });
    } finally {
      onBusyChange(false);
      setBusySlot(null);
    }
  }

  async function upload(photoSlot: RecipePhotoSlot, file: File) {
    if (busySlot) return;
    setBusySlot(photoSlot);
    onBusyChange(true);
    setError('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد.');
      const size = await photoDimensions(file);
      assertDimensions(size);
      const label = RECIPE_PHOTO_SLOTS.find(item => item.key === photoSlot)?.label;
      const asset = await uploadMedia(token, file, 'general', `تصویر رسپی · ${title.trim() || 'پیش‌نویس'} · ${label}`);
      onChange(photoSlot, { key: asset.key, alt: '', ...size });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بارگذاری تصویر انجام نشد.');
    } finally {
      onBusyChange(false);
      setBusySlot(null);
    }
  }

  return (
    <div className="recipe-fields__stack">
      <p className="recipe-muted">برای انتشار، کاور اصلی و متن جایگزین تصاویر انتخاب‌شده را وارد کنید.</p>
      {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
      <div className="recipe-media__slots">
        {RECIPE_PHOTO_SLOTS.map(({ key, label, description }) => {
          const photo = photos[key];
          const defaultCaption = key in recipeGalleryCaptions ? recipeGalleryCaptions[key as keyof typeof recipeGalleryCaptions] : '';
          return (
            <section className="recipe-media__slot" key={key} aria-label={label}>
              <div>
                <h3>{label}</h3>
                <p className="recipe-muted">{description}</p>
              </div>
              {photo ? (
                <div className="recipe-media__thumbnail">
                  {/* The URL resolves an image selected from the authenticated storage library. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaHref(photo.key)} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
                </div>
              ) : <div className="recipe-media__placeholder">تصویری انتخاب نشده است</div>}
              <div className="admin-actions recipe-media__actions">
                <button type="button" className="admin-button admin-button--secondary" disabled={Boolean(busySlot)} onClick={() => setSlot(key)}>کتابخانهٔ رسانه</button>
                <label className="admin-button admin-button--secondary cms-media-upload" aria-disabled={Boolean(busySlot)}>
                  {busySlot === key && !slot ? 'در حال بارگذاری…' : 'بارگذاری فایل'}
                  <input
                    className="sr-only"
                    type="file"
                    accept={MEDIA_ACCEPT}
                    disabled={Boolean(busySlot)}
                    aria-label={`بارگذاری فایل برای ${label}`}
                    onChange={event => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = '';
                      if (file) void upload(key, file);
                    }}
                  />
                </label>
              </div>
              {photo && (
                <div className="recipe-media__details">
                  <RecipeTextField label="متن جایگزین تصویر" value={photo.alt} maxLength={240} onChange={alt => onChange(key, { ...photo, alt })} />
                  <RecipeTextField label="کپشن روی سایت" value={photo.caption ?? defaultCaption} maxLength={240}
                    onChange={caption => onChange(key, { ...photo, caption })} />
                  <label className="recipe-media__check">
                    <input type="checkbox" checked={photo.generated ?? false} onChange={event => onChange(key, { ...photo, generated: event.target.checked })} />
                    تصویر با هوش مصنوعی ساخته شده است
                  </label>
                  <div className="recipe-media__meta">
                    <p className="recipe-muted"><bdi dir="ltr">{photo.width.toLocaleString('fa-IR')} × {photo.height.toLocaleString('fa-IR')}</bdi> پیکسل</p>
                    <button type="button" className="cms-media-remove" onClick={() => onChange(key, null)}>برداشتن از رسپی</button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
      {slot && <CmsMediaPicker
        label={RECIPE_PHOTO_SLOTS.find(item => item.key === slot)?.label ?? 'تصویر رسپی'}
        selectedKey={photos[slot]?.key}
        onChoose={asset => choose(slot, asset)}
        onClose={() => setSlot(null)}
      />}
    </div>
  );
}
