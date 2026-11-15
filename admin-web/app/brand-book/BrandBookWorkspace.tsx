'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { CollectionState } from '../../components/AdminForms';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { apiFetch, ApiError } from '../../lib/api';
import { mediaHref, type MediaAsset } from '../../lib/media';
import { BrandAssets } from './BrandAssets';
import { BrandChapterEditor } from './BrandChapterEditor';
import { BrandChat } from './BrandChat';
import { BrandIdentity } from './BrandIdentity';
import { BrandVoice } from './BrandVoice';
import { downloadSource, saveBook, type BrandBook, type Chapter, type SourceId } from './brand-book-api';

const expandableChapters = new Set(['story', 'voice', 'launch', 'measurement']);

function ChapterDetails({ chapter, children }: { chapter: Chapter; children: ReactNode }) {
  if (!expandableChapters.has(chapter.id)) return <>{children}</>;
  return <details className="brand-chapter-details">
    <summary aria-label={`جزئیات فصل ${chapter.title}`}>
      <span className="brand-details-label"><AdminIcon name="article" size={18} />جزئیات فصل</span>
      <span className="brand-details-toggle">
        <span className="brand-details-show">باز کردن</span>
        <span className="brand-details-hide">بستن</span>
        <AdminIcon name="plus" size={16} />
      </span>
    </summary>
    <div className="brand-chapter-details-body">{children}</div>
  </details>;
}

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
  const contents = useRef<HTMLDivElement>(null);
  const mobileContents = useRef<HTMLDetailsElement>(null);
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

  useEffect(() => {
    if (loading || !contents.current) return;
    const sections = Array.from(contents.current.querySelectorAll<HTMLElement>('[data-book-section]'));
    const root = document.documentElement;
    const update = () => {
      const readingLine = Math.min(window.innerHeight * .37, 290);
      const atEnd = root.scrollHeight - window.innerHeight - window.scrollY <= 2;
      const section = atEnd ? sections.at(-1) : sections.findLast(item => item.getBoundingClientRect().top <= readingLine);
      setActive(section?.dataset.bookSection ?? '');
    };
    let frame = requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
      update();
    });
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, [loading]);

  useEffect(() => {
    const pane = contents.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!pane || preference.matches || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        target.setAttribute('data-book-entered', '');
        observer.unobserve(target);
      }
    });
    const targets = [
      '.brand-chapter-head', '.brand-chapter-sections > section', '.brand-references',
      '.brand-chapter-details > summary', '.brand-identity-heading', '.brand-swatches > li',
      '.brand-logo-stage', '.brand-logo-controls', '.brand-voice-heading', '.brand-voice-layout',
      '.brand-identity > button', '.brand-chapter .admin-panel-head', '.brand-asset-tools',
      '.brand-asset-meta', '.brand-sources li', '.brand-asset-count',
    ].join(', ');
    pane.querySelectorAll(`:is(${targets}):not([data-book-entered])`).forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [loading, loadError, book, draft, assetsLoading, assets]);

  const current = draft ?? book;
  if (!current || loading || loadError) return <div className="admin-panel">
    <CollectionState loading={loading} error={loadError} onRetry={() => setAttempt(value => value + 1)} />
  </div>;

  const captions = new Map(current.assetCaptions.map(item => [item.key, item.caption]));
  const poster = assets.find(asset => asset.description === 'atmat-home-shore-poster') ?? assets.find(asset => asset.description === 'atmat-home-coast');
  function onChapter(id: string, revealDetails = false) {
    if (mobileContents.current) mobileContents.current.open = false;
    const target = document.getElementById(`book-${id}`);
    if (!target) return;
    const details = target.querySelector<HTMLDetailsElement>('.brand-chapter-details');
    if (revealDetails && details) details.open = true;
    if (location.hash !== `#${target.id}`) history.pushState(null, '', `#${target.id}`);
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', behavior });
  }

  const entries = [
    ...current.chapters.map(({ id, title }) => ({ id, title: title || 'فصل تازه' })),
    { id: 'assets', title: 'کتابخانهٔ دارایی‌ها' },
    { id: 'sources', title: 'اسناد مرجع' },
  ];
  const toc = <ol>{entries.map(({ id, title }) => <li key={id}>
    <a href={`#book-${id}`} aria-current={active === id ? 'location' : undefined} onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onChapter(id);
    }}>{title}</a>
  </li>)}</ol>;

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

  return <div className="brand-book" data-editing={Boolean(draft)}>
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
      <nav className="brand-book-nav" aria-label="فهرست فصل‌ها">
        <div className="brand-book-nav-desktop"><p><AdminIcon name="book" size={17} />فهرست فصل‌ها</p>{toc}</div>
        <details ref={mobileContents} className="brand-book-nav-mobile">
          <summary><AdminIcon name="book" size={17} />فهرست فصل‌ها<span aria-hidden="true">⌄</span></summary>
          {toc}
        </details>
      </nav>
      <div className="brand-book-pane" ref={contents}>
        {current.chapters.map(chapter => <article key={chapter.id} id={`book-${chapter.id}`} data-book-section={chapter.id}
          tabIndex={-1} aria-labelledby={`book-title-${chapter.id}`} className="brand-chapter">
          <header className="brand-chapter-head">
            <h2 id={`book-title-${chapter.id}`}>{chapter.title || 'فصل تازه'}</h2>
            <p>{chapter.summary}</p>
          </header>
          {!draft && chapter.id === 'voice' && <BrandVoice />}
          {draft ? <fieldset disabled={saving}><BrandChapterEditor chapter={chapter} sources={current.sources} onChange={updateChapter} /></fieldset> : <ChapterDetails chapter={chapter}>
            {chapter.id === 'identity' && <BrandIdentity assets={assets} onAssets={() => onChapter('assets')} />}
            <div className="brand-chapter-sections">{chapter.sections.map((section, index) => <section key={index}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div>
            {chapter.references.length > 0 && <footer className="brand-references">
              <h3><AdminIcon name="article" size={16} />ارجاع‌ها</h3><ul>{chapter.references.map((reference, index) => <li key={index}><button className="brand-download" type="button" onClick={() => onChapter('sources')}>{current.sources.find(source => source.id === reference.source)?.label}<span>{reference.location}</span></button></li>)}</ul>
            </footer>}
          </ChapterDetails>}
        </article>)}
        <section id="book-assets" data-book-section="assets" tabIndex={-1} aria-labelledby="brand-assets-title" className="brand-chapter brand-asset-section">
          {assetsLoading || assetError ? <>
            <h2 id="brand-assets-title">کتابخانهٔ دارایی‌های برند</h2>
            <CollectionState loading={assetsLoading} error={assetError} onRetry={() => setAssetAttempt(value => value + 1)} />
          </> : <BrandAssets token={token} assets={assets} captions={captions} editing={Boolean(draft)} disabled={saving} onCaption={updateCaption} onUpload={asset => setAssets(items => [asset, ...items])} />}
        </section>
        <section id="book-sources" data-book-section="sources" tabIndex={-1} aria-labelledby="brand-sources-title" className="brand-chapter brand-sources">
          <header className="admin-panel-head"><div><h2 id="brand-sources-title">اسناد مرجع</h2><p>فایل‌های اصلی مورد استفاده برای تدوین برند بوک</p></div></header>
          {sourceError && <p className="admin-alert admin-alert--error" role="alert">{sourceError}</p>}
          <ul>{current.sources.map(source => <li key={source.id}>
            <span className="brand-source-icon" aria-hidden="true"><AdminIcon name="article" size={22} /><small>{source.id === 'story' ? 'DOCX' : 'PDF'}</small></span>
            <div><h3 dir="auto">{source.title}</h3><p className="admin-muted">{source.detail}</p></div>
            <button type="button" className="admin-button admin-button--secondary" disabled={downloading !== null} onClick={() => void download(source.id)}><AdminIcon name="download" size={17} />{downloading === source.id ? 'در حال دریافت…' : 'دانلود سند'}</button>
          </li>)}</ul>
        </section>
      </div>
    </div>
    {chatOpen && <BrandChat token={token} sources={current.sources} onClose={() => setChatOpen(false)} onChapter={id => onChapter(id, true)} />}
  </div>;
}
