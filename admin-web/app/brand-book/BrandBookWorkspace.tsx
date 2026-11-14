'use client';

import { useEffect, useRef, useState } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { CollectionState } from '../../components/AdminForms';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { apiFetch, ApiError } from '../../lib/api';
import { mediaHref, type MediaAsset } from '../../lib/media';
import { BrandAssets } from './BrandAssets';
import { BrandChapterEditor } from './BrandChapterEditor';
import { BrandChat } from './BrandChat';
import { downloadSource, saveBook, type BrandBook, type Chapter, type SourceId } from './brand-book-api';

const palette = [
  ['آبی آب‌نمک', '#2D85CD'], ['سرمه‌ای', '#082438'], ['کرم', '#F8F4EC'], ['سبز نشان', '#0A7821'], ['زرد نشان', '#FBC001'],
];

export function BrandBookWorkspace() {
  return <AppShell title="برند بوک" description="راهنمای هویت، دارایی‌ها و استراتژی بازاریابی ات‌مت">
    <BrandBookContent />
  </AppShell>;
}

function BrandBookContent() {
  const { token } = useAdminWorkspace();
  const [book, setBook] = useState<BrandBook | null>(null);
  const [draft, setDraft] = useState<BrandBook | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetError, setAssetError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [assetAttempt, setAssetAttempt] = useState(0);
  const [downloading, setDownloading] = useState<SourceId | null>(null);
  const [sourceError, setSourceError] = useState('');
  const [active, setActive] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const pane = useRef<HTMLDivElement>(null);
  const dirty = Boolean(draft && draft !== book);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    void apiFetch<BrandBook>('/brand-book', token, { signal: controller.signal }).then(setBook).catch(problem => {
      if (!controller.signal.aborted) setLoadError(problem instanceof Error ? problem.message : 'برند بوک در دسترس نیست.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    setAssetError('');
    setAssetsLoading(true);
    void apiFetch<MediaAsset[]>('/brand-book/assets', token, { signal: controller.signal }).then(setAssets).catch(problem => {
      if (!controller.signal.aborted) setAssetError(problem instanceof Error ? problem.message : 'کتابخانه در دسترس نیست.');
    }).finally(() => { if (!controller.signal.aborted) setAssetsLoading(false); });
    return () => controller.abort();
  }, [token, assetAttempt]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const leave = (event: Event) => { if (!window.confirm('تغییرات ذخیره نشده‌اند. از صفحه خارج می‌شوید؟')) event.preventDefault(); };
    const navigate = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest('a[href]');
      const href = link?.getAttribute('href');
      if (!href?.startsWith('/') || href.startsWith('/brand-book') || link?.hasAttribute('target') || link?.hasAttribute('download') || event.metaKey || event.ctrlKey) return;
      if (!window.dispatchEvent(new Event('atmat:before-leave', { cancelable: true }))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('atmat:before-leave', leave);
    document.addEventListener('click', navigate, true);
    return () => {
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('atmat:before-leave', leave);
      document.removeEventListener('click', navigate, true);
    };
  }, [dirty]);

  const current = draft ?? book;
  if (!current || loading || loadError) return <div className="admin-panel">
    <CollectionState loading={loading} error={loadError} onRetry={() => setAttempt(value => value + 1)} />
  </div>;

  const chapter = current.chapters.find(item => item.id === active) ?? current.chapters[0];
  const chapterIndex = current.chapters.indexOf(chapter);
  const previous = current.chapters[chapterIndex - 1];
  const next = current.chapters[chapterIndex + 1];
  const showChapter = active !== 'assets' && active !== 'sources';
  const paneId = showChapter ? chapter.id : active;
  const captions = new Map(current.assetCaptions.map(item => [item.key, item.caption]));
  const poster = assets.find(asset => asset.description === 'atmat-home-shore-poster') ?? assets.find(asset => asset.description === 'atmat-home-coast');
  const onChapter = (id: string) => {
    setActive(id);
    window.requestAnimationFrame(() => {
      const target = pane.current;
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'start' });
    });
  };

  function updateChapter(updated: Chapter) {
    setDraft(value => value && ({ ...value, chapters: value.chapters.map(item => item.id === updated.id ? updated : item) }));
  }

  function updateCaption(key: string, caption: string) {
    setDraft(value => value && ({ ...value, assetCaptions: [...value.assetCaptions.filter(item => item.key !== key), { key, caption }] }));
  }

  function endEdit(reload = false) {
    if (dirty && !window.confirm('تغییرات ذخیره‌نشده کنار گذاشته شوند؟')) return;
    setDraft(null);
    setError('');
    setConflict(false);
    if (reload) setAttempt(value => value + 1);
  }

  async function save() {
    if (!draft || saving || conflict) return;
    if (!draft.cover.title.trim() || !draft.cover.tagline.trim()) {
      setError('عنوان و پیام روی جلد را کامل کنید.');
      return;
    }
    const incomplete = draft.chapters.find(item => !item.title.trim() || !item.summary.trim() ||
      item.sections.some(section => !section.title.trim() || !section.body.trim()) || item.references.some(reference => !reference.location.trim()));
    if (incomplete) {
      onChapter(incomplete.id);
      setError('عنوان، خلاصه، متن بخش‌ها و شمارهٔ صفحه یا فصل را کامل کنید.');
      return;
    }
    setSaving(true);
    setError('');
    const content = {
      ...draft,
      cover: { title: draft.cover.title.trim(), tagline: draft.cover.tagline.trim() },
      chapters: draft.chapters.map(item => ({
        ...item, title: item.title.trim(), summary: item.summary.trim(),
        sections: item.sections.map(section => ({ title: section.title.trim(), body: section.body.trim() })),
        references: item.references.map(reference => ({ ...reference, location: reference.location.trim() })),
      })),
      assetCaptions: draft.assetCaptions.filter(item => item.caption.trim()).map(item => ({ ...item, caption: item.caption.trim() })),
    };
    try {
      const version = await saveBook(token, content);
      setBook({ ...content, ...version });
      setDraft(null);
      setNotice('تغییرات برند بوک ذخیره شد.');
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'ذخیره انجام نشد.');
      setConflict(problem instanceof ApiError && problem.status === 409);
    } finally {
      setSaving(false);
    }
  }

  async function download(id: SourceId) {
    setSourceError('');
    setDownloading(id);
    try { await downloadSource(token, id); }
    catch (problem) { setSourceError(problem instanceof Error ? problem.message : 'دریافت فایل انجام نشد.'); }
    finally { setDownloading(null); }
  }

  return <div className="brand-book">
    <section className="brand-hero" aria-label="جوهرهٔ ات‌مت">
      <div className="brand-hero-copy">
        <span className="brand-hero-label" lang="en" dir="ltr">AT MAT <span aria-hidden="true">/</span> BRAND BOOK</span>
        <h2>{current.cover.title}</h2>
        <p>{current.cover.tagline}</p>
        <div className="brand-hero-actions">
          <button type="button" onClick={() => onChapter(current.chapters[0].id)}><AdminIcon name="book" size={18} />مطالعهٔ برند بوک<AdminIcon name="arrow" size={16} /></button>
        </div>
      </div>
      <div className="brand-hero-art" aria-hidden="true">
        {poster && <img className="brand-hero-image" src={mediaHref(poster.key)} alt="" fetchPriority="high" />}
      </div>
    </section>

    <div className="admin-editor-toolbar brand-toolbar" data-editing={Boolean(draft)}>
      <p className="brand-toolbar-status" role="status"><span aria-hidden="true" data-dirty={dirty} />{dirty ? 'تغییرات ذخیره‌نشده' : draft ? 'حالت ویرایش' : current.updatedAt ? `آخرین ویرایش ${new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(current.updatedAt))}` : 'مرجع داخلی تیم ات‌مت'}</p>
      <div className="admin-actions">
        {draft ? <>
          <button className="admin-button admin-button--secondary" type="button" disabled={saving} onClick={() => endEdit(conflict)}>{conflict ? 'باز کردن نسخهٔ تازه' : 'لغو ویرایش'}</button>
          <button className="admin-button admin-button--primary" type="button" disabled={!dirty || saving || conflict} onClick={() => void save()}><AdminIcon name="check" size={17} />{saving ? 'در حال ذخیره…' : 'ذخیرهٔ تغییرات'}</button>
        </> : <button className="admin-button admin-button--secondary" type="button" onClick={() => { setDraft(book); setNotice(''); }}><AdminIcon name="edit" size={17} />ویرایش برند بوک</button>}
        <button className={`admin-button admin-button--${draft ? 'secondary' : 'primary'}`} type="button" aria-haspopup="dialog" onClick={() => setChatOpen(true)}><AdminIcon name="chat" size={18} />دستیار برند</button>
      </div>
    </div>
    {draft && <fieldset className="admin-panel brand-cover-edit admin-form-grid" disabled={saving}>
      <label className="admin-field">عنوان روی جلد<input className="admin-input" maxLength={100} value={draft.cover.title} onChange={event => setDraft({ ...draft, cover: { ...draft.cover, title: event.target.value } })} /></label>
      <label className="admin-field">پیام روی جلد<input className="admin-input" maxLength={150} value={draft.cover.tagline} onChange={event => setDraft({ ...draft, cover: { ...draft.cover, tagline: event.target.value } })} /></label>
    </fieldset>}
    {notice && <p className="admin-alert" role="status">{notice}</p>}
    {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}

    <div className="brand-book-layout">
      <nav className="admin-panel brand-book-nav" aria-label="فصل‌های برند بوک">
        <p><AdminIcon name="book" size={17} />فهرست فصل‌ها</p>
        <label className="admin-field brand-book-select">بخش برند بوک<select className="admin-input" value={showChapter ? chapter.id : active} onChange={event => setActive(event.target.value)}>
          {current.chapters.map(item => <option value={item.id} key={item.id}>{item.title || 'فصل تازه'}</option>)}
          <option value="assets">دارایی‌های برند</option>
          <option value="sources">اسناد مرجع</option>
        </select></label>
        {current.chapters.map(item => <button key={item.id} type="button" aria-current={showChapter && item.id === chapter.id ? 'true' : undefined} onClick={() => onChapter(item.id)}><span>{item.title || 'فصل تازه'}</span><AdminIcon name="arrow" size={15} /></button>)}
        <div className="brand-book-nav-divider">
          <button type="button" aria-current={active === 'assets' ? 'true' : undefined} onClick={() => onChapter('assets')}><AdminIcon name="media" size={17} />دارایی‌های برند</button>
          <button type="button" aria-current={active === 'sources' ? 'true' : undefined} onClick={() => onChapter('sources')}><AdminIcon name="article" size={17} />اسناد مرجع</button>
        </div>
      </nav>
      <div className="brand-book-pane" key={paneId} ref={pane} tabIndex={-1} role="region" aria-label={showChapter ? chapter.title : active === 'assets' ? 'دارایی‌های برند' : 'اسناد مرجع'}>
        {showChapter && <article className="admin-panel brand-chapter">
          <header className="brand-chapter-head">
            <h2>{chapter.title || 'فصل تازه'}</h2>
            <p>{chapter.summary}</p>
          </header>
          {draft ? <fieldset disabled={saving}><BrandChapterEditor chapter={chapter} sources={current.sources} onChange={updateChapter} /></fieldset> : <>
            <div className="brand-chapter-sections">{chapter.sections.map((section, index) => <section key={index}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div>
            {chapter.id === 'identity' && <div className="brand-palette">
              <h3>نمونهٔ رنگ‌های رابط فعلی</h3>
              <ul>{palette.map(([name, value]) => <li key={name}><span aria-hidden="true" style={{ background: value }} /><div>{name}<bdi dir="ltr">{value}</bdi></div></li>)}</ul>
              <button type="button" className="admin-button admin-button--secondary" onClick={() => onChapter('assets')}>مشاهدهٔ نشان‌ها و راهنمای رنگ چاپ</button>
            </div>}
            {chapter.references.length > 0 && <footer className="brand-references">
              <h3><AdminIcon name="article" size={16} />ارجاع‌ها</h3><ul>{chapter.references.map((reference, index) => <li key={index}><button className="brand-download" type="button" onClick={() => onChapter('sources')}>{current.sources.find(source => source.id === reference.source)?.label}<span>{reference.location}</span></button></li>)}</ul>
            </footer>}
            {(previous || next) && <nav className="brand-chapter-pagination" aria-label="ورق زدن فصل‌ها">
              {previous && <button type="button" onClick={() => onChapter(previous.id)}><AdminIcon name="arrow" size={17} /><span><small>فصل قبل</small>{previous.title}</span></button>}
              {next && <button type="button" onClick={() => onChapter(next.id)}><span><small>فصل بعد</small>{next.title}</span><AdminIcon name="arrow" size={17} /></button>}
            </nav>}
          </>}
        </article>}
        {active === 'assets' && (assetsLoading || assetError ? <div className="admin-panel"><CollectionState loading={assetsLoading} error={assetError} onRetry={() => setAssetAttempt(value => value + 1)} /></div> :
          <BrandAssets token={token} assets={assets} captions={captions} editing={Boolean(draft)} disabled={saving} onCaption={updateCaption} onUpload={asset => setAssets(items => [asset, ...items])} />)}
        {active === 'sources' && <section className="admin-panel brand-sources">
          <header className="admin-panel-head"><div><h2>اسناد مرجع</h2><p>فایل‌های اصلی مورد استفاده برای تدوین برند بوک</p></div></header>
          {sourceError && <p className="admin-alert admin-alert--error" role="alert">{sourceError}</p>}
          <ul>{current.sources.map(source => <li key={source.id}>
            <span className="brand-source-icon" aria-hidden="true"><AdminIcon name="article" size={22} /><small>{source.id === 'story' ? 'DOCX' : 'PDF'}</small></span>
            <div><h3 dir="auto">{source.title}</h3><p className="admin-muted">{source.detail}</p></div>
            <button type="button" className="admin-button admin-button--secondary" disabled={downloading !== null} onClick={() => void download(source.id)}><AdminIcon name="download" size={17} />{downloading === source.id ? 'در حال دریافت…' : 'دانلود سند'}</button>
          </li>)}</ul>
        </section>}
      </div>
    </div>
    {chatOpen && <BrandChat token={token} sources={current.sources} onClose={() => setChatOpen(false)} onChapter={onChapter} />}
  </div>;
}
