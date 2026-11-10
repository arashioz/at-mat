'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { AdminSearch, CollectionState, faCount, normalizeQuery } from '../../components/AdminForms';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { EDITORIAL_CATEGORIES, listMedia, MEDIA_ACCEPT, mediaHref, photoDimensions, uploadMedia, type MediaAsset, type MediaCategory } from '../../lib/media';

const LABELS: Record<MediaCategory, string> = { general: 'محتوا', products: 'محصولات', branding: 'هویت بصری' };
const PAGE_SIZE = 24;

function Library() {
  const { token } = useAdminWorkspace();
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MediaCategory | 'all'>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<MediaCategory>('general');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setLoadError('');
    try { setItems((await listMedia(token)).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))); }
    catch (err) { setLoadError(err instanceof Error ? err.message : 'کتابخانه در دسترس نیست.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || sending) return;
    const form = event.currentTarget;
    setSending(true); setUploadError(''); setNotice('');
    try {
      await photoDimensions(file);
      const image = await uploadMedia(token, file, category, description);
      setItems(previous => [image, ...previous.filter(item => item.key !== image.key)]);
      setFile(null); setCategory('general'); setDescription(''); setQuery(''); setFilter('all'); setLimit(PAGE_SIZE);
      form.reset();
      setNotice('تصویر بارگذاری شد و در ویرایشگر مقالات و رسپی‌ها قابل انتخاب است.');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'بارگذاری انجام نشد.');
    } finally {
      setSending(false);
    }
  }

  const visible = items.filter(item => (filter === 'all' || item.category === filter) && normalizeQuery(`${item.description ?? ''} ${item.originalName}`).includes(normalizeQuery(query)));
  return <div className="admin-section-stack">
    <details className="admin-panel admin-disclosure">
      <summary><span><AdminIcon name="upload" />بارگذاری تصویر</span><AdminIcon name="plus" size={17} /></summary>
      <form className="admin-form-grid" onSubmit={upload}>
        <label className="admin-field"><span>فایل تصویر</span><input className="admin-input" type="file" accept={MEDIA_ACCEPT} onChange={e => setFile(e.target.files?.[0] ?? null)} required /><small>JPEG، PNG یا WebP؛ تا ۵ مگابایت</small></label>
        <label className="admin-field"><span>دسته‌بندی</span><select className="admin-input" value={category} onChange={e => setCategory(e.target.value as MediaCategory)}>{EDITORIAL_CATEGORIES.map(key => <option key={key} value={key}>{LABELS[key]}</option>)}</select></label>
        <label className="admin-field"><span>توضیح تصویر</span><input className="admin-input" value={description} maxLength={240} onChange={e => setDescription(e.target.value)} placeholder="برای پیدا کردن تصویر در کتابخانه" /></label>
        <div className="admin-form-footer"><button className="admin-button admin-button--primary" type="submit" disabled={sending || !file}>{sending ? 'در حال بارگذاری…' : 'بارگذاری'}</button></div>
        {uploadError && <p className="admin-form-wide admin-alert admin-alert--error" role="alert">{uploadError}</p>}
        {notice && <p className="admin-form-wide admin-alert" role="status">{notice}</p>}
      </form>
    </details>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h2>تصاویر سایت</h2><p role="status">{faCount(visible.length)} تصویر</p></div><AdminSearch value={query} onChange={value => { setQuery(value); setLimit(PAGE_SIZE); }} label="جست‌وجوی تصویر" /></div>
      <div className="admin-filter-pills" role="group" aria-label="دسته‌بندی تصاویر">
        <button className="at-pill" type="button" aria-pressed={filter === 'all'} onClick={() => { setFilter('all'); setLimit(PAGE_SIZE); }}>همه</button>
        {EDITORIAL_CATEGORIES.map(key => <button className="at-pill" key={key} type="button" aria-pressed={filter === key} onClick={() => { setFilter(key); setLimit(PAGE_SIZE); }}>{LABELS[key]}</button>)}
      </div>
      <CollectionState loading={loading} error={loadError} empty={!visible.length ? 'تصویری با این مشخصات پیدا نشد.' : undefined} onRetry={refresh} />
      {visible.length > 0 && <ul className="admin-media-grid">
        {visible.slice(0, limit).map(item => <li key={item.key} data-category={item.category} className="admin-media-card"><a href={mediaHref(item.key)} target="_blank" rel="noreferrer">
          <img src={mediaHref(item.key)} alt="" width={320} height={215} loading="lazy" />
          <div><span className="admin-chip">{LABELS[item.category]}</span><p dir="auto" title={item.description || item.originalName}>{item.description || item.originalName}</p></div>
        </a></li>)}
      </ul>}
      {limit < visible.length && <button className="admin-button admin-button--secondary admin-media-more" type="button" onClick={() => setLimit(current => current + PAGE_SIZE)}>تصاویر بیشتر</button>}
    </section>
  </div>;
}

export default function LibraryPage() {
  return <AppShell title="کتابخانهٔ رسانه" eyebrow="مدیریت محتوا" description="تصاویر مقاله‌ها، رسپی‌ها، محصولات و هویت بصری را از یک جا پیدا کن."><Library /></AppShell>;
}
