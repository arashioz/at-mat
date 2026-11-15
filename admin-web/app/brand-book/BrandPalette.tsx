'use client';

import { useRef, useState } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { mediaHref, type MediaAsset } from '../../lib/media';
import { saveDownload } from './brand-book-api';
import { brandColors } from './brand-colors';

function downloadPalette() {
  const css = [':root {', ...brandColors.map(({ token, hex }) => `  ${token}: ${hex};`), '}', ''].join('\n');
  saveDownload(new Blob([css], { type: 'text/css;charset=utf-8' }), 'at-mat-palette.css');
}

export function BrandPalette({ print }: { print?: MediaAsset }) {
  const [feedback, setFeedback] = useState<{ hex: string; copied: boolean }>();
  const attempt = useRef(0);

  async function copy(hex: string) {
    const id = ++attempt.current;
    let copied = false;
    try {
      await navigator.clipboard.writeText(hex);
      copied = true;
    } catch {
      // The visible HEX remains available for manual copying.
    }
    if (id === attempt.current) setFeedback({ hex, copied });
  }

  return <section className="brand-palette" aria-labelledby="brand-palette-title">
    <div className="brand-identity-heading">
      <div><h3 id="brand-palette-title">پالت دیجیتال</h3><p>برای کپی کد HEX، روی رنگ بزنید.</p></div>
      <div className="brand-palette-downloads">
        <button type="button" className="admin-button admin-button--secondary" onClick={downloadPalette}><AdminIcon name="download" size={16} />فایل CSS</button>
        {print && <a className="admin-button admin-button--secondary" href={mediaHref(print.key)} download={print.originalName}><AdminIcon name="download" size={16} />راهنمای چاپ CMYK</a>}
      </div>
    </div>
    <ul className="brand-swatches">{brandColors.map(({ name, hex, usage, token, ink }) => <li key={hex}>
      <button type="button" className="brand-swatch" style={{ backgroundColor: `var(${token})`, color: ink }} onClick={() => void copy(hex)} aria-label={`کپی کد ${hex}، ${name}`}>
        <span><strong>{name}</strong><small>{usage}</small></span>
        <span className="brand-swatch-code"><bdi>{hex}</bdi>
          {feedback?.hex === hex && feedback.copied ? <AdminIcon name="check" size={17} /> : <span aria-hidden="true">کپی</span>}
        </span>
      </button>
    </li>)}</ul>
    <p className="brand-copy-status" role="status">{feedback && (feedback.copied ? <>کد <bdi>{feedback.hex}</bdi> کپی شد.</> : <>کپی خودکار در دسترس نیست. کد رنگ <bdi>{feedback.hex}</bdi> است.</>)}</p>
  </section>;
}
