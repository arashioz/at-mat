'use client';

import { useState } from 'react';
import { AdminSearch, faCount, normalizeQuery } from '../../components/AdminForms';
import { AdminIcon } from '../../components/AdminIcon';
import { mediaHref, MEDIA_ACCEPT, uploadMedia, type MediaAsset } from '../../lib/media';

const flavors: Record<string, string> = {
  brine: 'آب‌نمک', sunflower: 'آفتابگردان', 'olive-oil': 'زیتون', pepper: 'فلفلی', smoked: 'دودی', dill: 'شوید',
};
const names: Record<string, string> = {
  'atmat-logo-fa': 'نشان فارسی ات‌مت',
  'atmat-logo-en': 'نشان انگلیسی ات‌مت',
  'brand-book-color-guide': 'راهنمای رنگ نشان · CMYK',
  'atmat-home-coast': 'تصویر ساحلی صفحهٔ خانه',
  'atmat-home-shore-poster': 'پوستر ساحل صفحهٔ خانه',
  'atmat-showcase-tuna-pattern': 'الگوی تصویرسازی تن ماهی',
  'brand-book-coastal-water-original': 'بافت آب ساحلی · فایل اصلی',
  'brand-book-coastal-water-web': 'بافت آب ساحلی · نسخهٔ وب',
  'brand-book-tuna-salad-original': 'سالاد تن · تصویر ادیتوریال اصلی',
  'brand-book-tuna-pasta-original': 'پاستای تن · تصویر ادیتوریال اصلی',
  'brand-book-tuna-sandwich-original': 'ساندویچ تن · تصویر ادیتوریال اصلی',
  'brine-idea-salad': 'سالاد تن · نسخهٔ وب',
  'brine-idea-pasta': 'پاستای تن · نسخهٔ وب',
  'brine-idea-sandwich': 'ساندویچ تن · نسخهٔ وب',
};
const packaging: Record<string, string> = {
  '02': 'لیبل زیتون', '03': 'لیبل فلفلی', '04': 'لیبل دودی', '05': 'لیبل آب‌نمک', '06': 'لیبل شوید', '07': 'لیبل آفتابگردان',
  '09': 'درب زیتون', '10': 'درب فلفلی', '11': 'درب دودی', '12': 'درب آب‌نمک', '13': 'درب شوید', '14': 'درب آفتابگردان',
};
const groups = [
  { id: 'all', label: 'همه' }, { id: 'logos', label: 'نشان و رنگ' }, { id: 'pack', label: 'بسته‌بندی' },
  { id: 'illustration', label: 'تصویرسازی' }, { id: 'photo', label: 'عکاسی و بافت' },
] as const;

function details(asset: MediaAsset) {
  const description = asset.description || '';
  const flavor = Object.keys(flavors).find(id => description.startsWith(`${id}-`) || description.startsWith(`atmat-showcase-${id}-`));
  const name = flavor ? flavors[flavor] : '';
  const flat = description.match(/^brand-book-packaging-(\d\d)$/)?.[1];
  if (flat) return { group: 'pack', title: `${packaging[flat] || 'بسته‌بندی'} · طرح مرجع` };
  if (description.includes('-logo-') || description === 'brand-book-color-guide') return { group: 'logos', title: names[description] ?? description };
  if (description.startsWith('atmat-showcase-')) return { group: 'illustration', title: names[description] ?? `تصویرسازی ${name}` };
  if (description.includes('-label-') || description.includes('-lid')) {
    const size = description.match(/\d+k$/)?.[0];
    return { group: 'pack', title: `${description.includes('-lid') ? 'درب' : 'لیبل'} ${name}${size ? ` · ${size.toUpperCase()}` : ''}` };
  }
  return { group: 'photo', title: names[description] ?? (description || asset.originalName) };
}

export function BrandAssets({ token, assets, captions, onCaption, onUpload, editing, disabled }: {
  token: string; assets: MediaAsset[]; captions: Map<string, string>; editing: boolean; disabled: boolean;
  onCaption: (key: string, caption: string) => void; onUpload: (asset: MediaAsset) => void;
}) {
  const [group, setGroup] = useState('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(18);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const visible = assets.map(asset => ({ asset, ...details(asset) })).sort((a, b) =>
    groups.findIndex(item => item.id === a.group) - groups.findIndex(item => item.id === b.group) ||
    Number(b.asset.description?.startsWith('brand-book-packaging-') ?? false) -
    Number(a.asset.description?.startsWith('brand-book-packaging-') ?? false))
    .filter(item => (group === 'all' || group === item.group) &&
      normalizeQuery(`${captions.get(item.asset.key) ?? ''} ${item.title} ${item.asset.originalName} ${item.asset.description ?? ''}`).includes(normalizeQuery(query)));

  async function upload(file: File) {
    setUploading(true);
    setError('');
    try {
      onUpload(await uploadMedia(token, file, 'branding'));
      setGroup('all');
      setQuery('');
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'بارگذاری انجام نشد.');
    } finally {
      setUploading(false);
    }
  }

  return <section className="admin-panel brand-assets" aria-labelledby="brand-assets-title">
    <header className="admin-panel-head">
      <div><h2 id="brand-assets-title">کتابخانهٔ دارایی‌های برند</h2><p>نشان‌ها، رنگ چاپ، لیبل و درب، تصویرسازی و عکس‌های ات‌مت</p></div>
      {editing && <label className="admin-field"><span>افزودن تصویر به کتابخانه</span><input className="admin-input" type="file" accept={MEDIA_ACCEPT} disabled={uploading || disabled} onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) void upload(file);
      }} /><small>بارگذاری مستقیماً در کتابخانهٔ رسانه ثبت می‌شود.</small></label>}
    </header>
    <div className="brand-asset-tools">
      <div className="brand-filters" aria-label="گروه دارایی‌ها">{groups.map(item => <button type="button" key={item.id} aria-pressed={item.id === group} onClick={() => { setGroup(item.id); setLimit(18); }}>{item.label}</button>)}</div>
      <AdminSearch value={query} label="جست‌وجوی دارایی‌ها" placeholder="نام دارایی یا طعم" onChange={value => { setQuery(value); setLimit(18); }} />
    </div>
    <p className="brand-asset-count" role="status">{faCount(visible.length)} تصویر{visible.length !== assets.length ? ` از ${faCount(assets.length)}` : ''}</p>
    {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
    {uploading && <p className="admin-muted" role="status">در حال بارگذاری تصویر…</p>}
    {visible.length === 0 && <p className="admin-muted">دارایی مطابق این فیلتر پیدا نشد.</p>}
    <ul className="brand-asset-grid">
      {visible.slice(0, limit).map(({ asset, group: assetGroup, title }) => {
        const label = captions.get(asset.key) || title;
        const src = mediaHref(asset.key);
        return <li key={asset.key} className="brand-asset">
          <a className={`brand-asset-image brand-asset-image--${assetGroup}`} href={src} target="_blank" rel="noreferrer" aria-label={`نمایش ${label}`}>
            <img src={src} alt={label} loading="lazy" decoding="async" />
            <span className="brand-asset-open"><AdminIcon name="external" size={16} /></span>
          </a>
          <div className="brand-asset-meta">
            <h3 dir="auto">{label}</h3>
            {editing && <label className="admin-field">عنوان نمایشی<input className="admin-input" value={captions.get(asset.key) ?? ''} placeholder={title} maxLength={180} disabled={disabled} onChange={event => onCaption(asset.key, event.target.value)} /></label>}
            <a className="brand-download" href={src} download={asset.originalName}><AdminIcon name="download" size={16} />دانلود تصویر</a>
          </div>
        </li>;
      })}
    </ul>
    {limit < visible.length && <button className="admin-button admin-button--secondary" type="button" onClick={() => setLimit(value => value + 18)}>دارایی‌های بیشتر</button>}
  </section>;
}
