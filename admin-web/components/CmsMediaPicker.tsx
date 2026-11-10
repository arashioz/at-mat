import { useEffect, useId, useRef, useState } from 'react';
import { listMedia, mediaHref, type MediaAsset } from '../lib/media';
import { AdminSearch, normalizeQuery } from './AdminForms';
import { useAdminWorkspace } from './AppShell';

const PAGE_SIZE = 24;

export function CmsMediaPicker({ label, selectedKey, onChoose, onClose }: {
  label: string;
  selectedKey?: string;
  onChoose: (asset: MediaAsset) => void | Promise<void>;
  onClose: () => void;
}) {
  const { token } = useAdminWorkspace();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    void listMedia(token).then(items => {
      if (current) setAssets(items.slice().reverse());
    }).catch(problem => {
      if (current) setError(problem instanceof Error ? problem.message : 'کتابخانهٔ رسانه در دسترس نیست.');
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [token, attempt]);

  async function choose(asset: MediaAsset) {
    if (inFlight.current) return;
    inFlight.current = true;
    setChoosing(true);
    setError('');
    try {
      if (asset.key !== selectedKey) await onChoose(asset);
      dialog.current?.close();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'انتخاب تصویر انجام نشد.');
    } finally {
      inFlight.current = false;
      setChoosing(false);
    }
  }

  const query = normalizeQuery(search);
  const filtered = (assets ?? []).filter(asset => normalizeQuery(`${asset.description ?? ''} ${asset.originalName} ${asset.key}`).includes(query));

  return (
    <dialog ref={dialog} className="cms-media-dialog" aria-labelledby={id} onClose={onClose}
      onCancel={event => { if (inFlight.current) event.preventDefault(); }}>
      <header className="cms-media-dialog-head">
        <div><h2 id={id}>انتخاب از کتابخانهٔ رسانه</h2><p className="admin-muted">{label}</p></div>
        <button type="button" className="admin-button admin-button--secondary" disabled={choosing} onClick={() => dialog.current?.close()}>بستن</button>
      </header>
      <AdminSearch label="جست‌وجو در تصاویر" value={search} onChange={value => { setSearch(value); setVisible(PAGE_SIZE); }} placeholder="نام فایل یا توضیح تصویر" />
      {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
      {loading && <p className="admin-muted" role="status">در حال دریافت تصاویر…</p>}
      {choosing && <p className="admin-muted" role="status">در حال آماده‌سازی تصویر…</p>}
      {!loading && assets === null && <button type="button" className="admin-button admin-button--secondary" onClick={() => setAttempt(value => value + 1)}>تلاش دوباره</button>}
      {!loading && assets !== null && !filtered.length && <p className="admin-empty">تصویری با این جست‌وجو پیدا نشد.</p>}
      {filtered.length > 0 && (
        <ul className="cms-media-grid">
          {filtered.slice(0, visible).map(asset => (
            <li key={asset.key}>
              <button type="button" aria-pressed={asset.key === selectedKey} disabled={choosing} onClick={() => void choose(asset)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaHref(asset.key)} alt="" width="180" height="120" loading="lazy" />
                <span>{asset.description || asset.originalName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {visible < filtered.length && <button type="button" className="admin-button admin-button--secondary" disabled={choosing} onClick={() => setVisible(count => count + PAGE_SIZE)}>تصاویر بیشتر</button>}
    </dialog>
  );
}
