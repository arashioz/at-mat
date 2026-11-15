'use client';

import { useState } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { mediaHref, type MediaAsset } from '../../lib/media';
import { BrandPalette } from './BrandPalette';
import { brandColors } from './brand-colors';

const logos = [
  { description: 'atmat-logo-fa', title: 'لوگوی فارسی' },
  { description: 'atmat-logo-en', title: 'لوگوی انگلیسی' },
];

export function BrandIdentity({ assets, onAssets }: { assets: MediaAsset[]; onAssets: () => void }) {
  const print = assets.find(asset => asset.description === 'brand-book-color-guide');
  const [background, setBackground] = useState<(typeof brandColors)[number]>(brandColors[1]);

  return <div className="brand-identity">
    <section className="brand-logo-studio" aria-labelledby="brand-logo-title">
      <div className="brand-identity-heading">
        <div><h3 id="brand-logo-title">استودیوی لوگو</h3><p>نشان فارسی و انگلیسی را روی زمینه‌های مختلف مقایسه کنید.</p></div>
      </div>
      <div className="brand-logo-stage" style={{ backgroundColor: `var(${background.token})`, color: background.ink }}>
        <div className="brand-logo-grid">{logos.map(({ description, title }) => {
          const asset = assets.find(item => item.description === description);
          return <figure key={description}>
            <div className="brand-logo-preview">
              {asset ? <img src={mediaHref(asset.key)} alt={title} loading="lazy" decoding="async" /> : <span>پیش‌نمایش در دسترس نیست</span>}
            </div>
            <figcaption>{title}</figcaption>
          </figure>;
        })}</div>
      </div>
      <div className="brand-logo-controls">
        <div className="brand-logo-controls-heading"><strong>رنگ زمینه</strong><span>{background.name} <bdi>{background.hex}</bdi></span></div>
        <div className="brand-logo-options" role="group" aria-label="رنگ زمینهٔ لوگو">
          {brandColors.map(color => <button key={color.hex} type="button" aria-label={color.name} aria-pressed={background.hex === color.hex} onClick={() => setBackground(color)}>
            <span style={{ backgroundColor: `var(${color.token})`, color: color.ink }} aria-hidden="true">
              {background.hex === color.hex && <AdminIcon name="check" size={16} />}
            </span>
          </button>)}
        </div>
        <div className="brand-logo-downloads">{logos.map(({ description, title }) => {
          const asset = assets.find(item => item.description === description);
          return asset && <a key={description} className="brand-download" href={mediaHref(asset.key)} download={asset.originalName}><AdminIcon name="download" size={16} />دانلود {title}</a>;
        })}</div>
      </div>
    </section>
    <BrandPalette print={print} />
    <button type="button" className="brand-download" onClick={onAssets}><AdminIcon name="media" size={17} />رفتن به کتابخانهٔ دارایی‌ها</button>
  </div>;
}
