'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { AdminSearch } from '../../components/AdminForms';
import { AdminIcon } from '../../components/AdminIcon';
import { CmsEditorToolbar, CmsPublishChecklist, CmsSections, focusCmsPanel, showCmsChecklist } from '../../components/CmsEditor';
import {
  ArticleBody, ArticleDetails, ArticleIntro, ArticleMedia, ArticleQuestions, ArticleRelations, ArticleSeo, ArticleSources,
} from '../../components/articles/ArticleFields';
import { ArticlePreview } from '../../components/articles/ArticlePreview';
import { apiFetch } from '../../lib/api';
import { newCmsSlug } from '../../lib/cms';
import { mediaHref, uploadMedia } from '../../lib/media';
import {
  articleCategories, articleStatus, articleWordCount, blankArticle, editableArticle,
  formatNumber, normalizeSearch, publishChecklist, siteOrigin, slugPattern,
  type ArticleFields, type ArticleMediaTarget, type ArticleRecord, type ArticleSummary,
  type ArticleTab, type RecipeChoice,
} from '../../lib/articles';
import './articles-admin.css';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type Filter = 'all' | 'published' | 'draft' | 'staged';
type Editor = { saved: ArticleRecord | null; fields: ArticleFields; baseline: ArticleFields };
const unsavedArticles = new Map<string, Editor>();

const tabs: ReadonlyArray<{ id: ArticleTab; label: string }> = [
  { id: 'details', label: 'مشخصات' },
  { id: 'intro', label: 'مقدمه و نکته‌ها' },
  { id: 'body', label: 'بدنهٔ مقاله' },
  { id: 'media', label: 'تصاویر' },
  { id: 'faq', label: 'پرسش‌ها' },
  { id: 'sources', label: 'منابع' },
  { id: 'seo', label: 'سئو' },
  { id: 'relations', label: 'محتوای مرتبط' },
];
const statuses: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: 'all', label: 'همه' },
  { id: 'published', label: 'منتشرشده' },
  { id: 'draft', label: 'پیش‌نویس' },
  { id: 'staged', label: 'در انتظار انتشار' },
];

const versionHeader = (article: ArticleRecord) => ({ 'If-Match': JSON.stringify(article.updatedAt) });
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

function editorFor(record: ArticleRecord | null): Editor {
  const fields = record ? editableArticle(record) : blankArticle();
  return { saved: record, fields, baseline: fields };
}

function StatusChip({ article }: { article: Pick<ArticleSummary, 'status' | 'hasUnpublishedChanges'> }) {
  const variant = article.status === 'published' && !article.hasUnpublishedChanges ? 'live' : 'draft';
  return <span className={'admin-chip admin-chip--' + variant}>{articleStatus(article)}</span>;
}

function ArticleArchive({ items, loadState, loadError, busy, onSelect, onRetry, onNew, archive }: {
  items: ArticleSummary[];
  loadState: LoadState;
  loadError: string;
  archive: RefObject<HTMLElement>;
  busy: boolean;
  onSelect: (article: ArticleSummary) => void;
  onRetry: () => void;
  onNew: () => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<Filter>('all');
  const term = normalizeSearch(search);
  const results = items.filter(article =>
    (!category || article.category === category)
    && (status === 'all' || (status === 'staged' ? article.hasUnpublishedChanges : article.status === status))
    && normalizeSearch([article.title, article.category, article.slug].join(' ')).includes(term),
  );

  return (
    <section ref={archive} className="admin-panel article-library" aria-labelledby="article-library-title">
      <header className="article-library-heading">
        <div>
          <h2 id="article-library-title" tabIndex={-1}>آرشیو مجله</h2>
          <a className="cms-edit-action" href={siteOrigin + '/articles'} target="_blank" rel="noreferrer">
            مشاهدهٔ مجله <AdminIcon name="external" size={15} />
          </a>
        </div>
        <button type="button" className="admin-button admin-button--primary" data-article-open="new"
          onClick={onNew} disabled={busy || loadState !== 'ready'}>
          <AdminIcon name="plus" size={17} />مقالهٔ جدید
        </button>
      </header>
      <div className="article-library-filters">
        <AdminSearch value={search} onChange={setSearch} label="جست‌وجو در آرشیو" placeholder="عنوان یا نشانی مقاله" />
        <label className="admin-field">
          <span>دسته‌بندی</span>
          <select className="admin-input" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">همهٔ دسته‌ها</option>
            {articleCategories.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        <div className="admin-filter-pills article-filters" role="group" aria-label="وضعیت مقاله">
          {statuses.map(option => (
            <button key={option.id} type="button" className="at-pill" aria-pressed={status === option.id} onClick={() => setStatus(option.id)}>{option.label}</button>
          ))}
        </div>
      </div>
      {loadState === 'loading' && <p role="status" className="article-library-message">در حال دریافت مقالات…</p>}
      {loadState === 'error' && (
        <div role="alert" className="admin-alert admin-alert--error">
          <p>{loadError}</p>
          <button type="button" className="admin-button admin-button--secondary" onClick={onRetry}>تلاش دوباره</button>
        </div>
      )}
      {loadState === 'ready' && <p className="article-library-message" aria-live="polite">{formatNumber(results.length)} مقاله</p>}
      {loadState === 'ready' && (results.length ? (
        <ul className="article-library-results">
          {results.map(article => (
            <li key={article._id}>
              <button type="button" className="article-library-item" data-article-open={article._id}
                disabled={busy} onClick={() => onSelect(article)}>
                <span className="article-library-thumb">
                  {article.cover ? <img src={mediaHref(article.cover.key)} alt="" loading="lazy" /> : <AdminIcon name="article" size={22} />}
                </span>
                <span className="article-library-copy">
                  <strong>{article.title}</strong>
                  <span className="article-library-meta">{article.category} · {formatNumber(article.wordCount ?? 0)} کلمه</span>
                </span>
                <StatusChip article={article} />
                <span className="cms-edit-action" aria-hidden="true">ویرایش <AdminIcon name="arrow" size={16} /></span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="admin-empty article-library-message">
          <p>{items.length ? 'مقاله‌ای با این فیلترها پیدا نشد.' : 'هنوز مقاله‌ای ثبت نشده است.'}</p>
          {(search || category || status !== 'all') && <button type="button" className="admin-button admin-button--secondary" onClick={() => {
            setSearch(''); setCategory(''); setStatus('all');
          }}>پاک‌کردن فیلترها</button>}
        </div>
      ))}
    </section>
  );
}

function ArticleWorkspace() {
  const { token, user } = useAdminWorkspace();
  const [items, setItems] = useState<ArticleSummary[]>([]);
  const [recipes, setRecipes] = useState<RecipeChoice[]>([]);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [recovery, setRecovery] = useState(() => unsavedArticles.get(user._id));
  const [tab, setTab] = useState<ArticleTab>('details');
  const [preview, setPreview] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [recipeState, setRecipeState] = useState<LoadState>('idle');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const requirements = useRef<HTMLDetailsElement>(null);
  const archive = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const lastOpened = useRef<string | null>(null);
  const suggestedSlug = useRef('');
  const dirty = editor !== null && JSON.stringify(editor.fields) !== JSON.stringify(editor.baseline);
  const record = editor?.saved;
  const fields = editor?.fields;
  const words = fields ? articleWordCount(fields) : 0;
  const editingKey = editor ? record?._id ?? 'new' : null;

  const loadArchive = useCallback(async (signal?: AbortSignal) => {
    setLoadState('loading');
    try {
      const rows = await apiFetch<ArticleSummary[]>('/articles?summary=1', token, { signal });
      if (signal?.aborted) return;
      setItems(rows);
      setLoadState('ready');
    } catch (problem) {
      if (signal?.aborted) return;
      setLoadError(errorMessage(problem, 'آرشیو مقالات بارگذاری نشد.'));
      setLoadState('error');
    }
  }, [token]);

  useEffect(() => {
    const request = new AbortController();
    void loadArchive(request.signal);
    return () => request.abort();
  }, [loadArchive]);

  useEffect(() => {
    if (editingKey) {
      editorHeading.current?.focus();
    } else if (lastOpened.current) {
      const item = archive.current?.querySelector<HTMLButtonElement>(`[data-article-open="${CSS.escape(lastOpened.current)}"]`);
      (item ?? archive.current?.querySelector('h2'))?.focus();
      lastOpened.current = null;
    }
  }, [editingKey]);

  useEffect(() => {
    if (!editor) return;
    if (dirty) unsavedArticles.set(user._id, editor);
    else unsavedArticles.delete(user._id);
  }, [dirty, editor, user._id]);

  useEffect(() => {
    if (!dirty && !busy) return;
    function confirmLeave() {
      return !busy && window.confirm('تغییرات این مقاله هنوز ذخیره نشده‌اند. از ویرایش خارج می‌شوید؟');
    }
    function beforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }
    function beforeLeave(event: Event) {
      if (!confirmLeave()) event.preventDefault();
      else unsavedArticles.delete(user._id);
    }
    function beforeLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target instanceof Element ? event.target : null)?.closest<HTMLAnchorElement>('a[href]');
      if (!link || (link.target && link.target !== '_self')) return;
      const destination = new URL(link.href);
      if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        unsavedArticles.delete(user._id);
      }
    }
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('atmat:before-leave', beforeLeave);
    document.addEventListener('click', beforeLink, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('atmat:before-leave', beforeLeave);
      document.removeEventListener('click', beforeLink, true);
    };
  }, [dirty, busy, user._id]);

  const loadRecipes = useCallback(async () => {
    setRecipeState('loading');
    try {
      const choices = await apiFetch<RecipeChoice[]>('/recipes', token);
      setRecipes(choices);
      setRecipeState('ready');
    } catch {
      setRecipeState('error');
    }
  }, [token]);

  useEffect(() => {
    if ((tab === 'relations' || preview) && recipeState === 'idle') void loadRecipes();
  }, [tab, preview, recipeState, loadRecipes]);

  function canClose() {
    return !inFlight.current && ((!dirty && !recovery) || window.confirm('تغییرات ذخیره نشده‌اند. ویرایش این مقاله کنار گذاشته شود؟'));
  }

  function change<K extends keyof ArticleFields>(key: K, value: ArticleFields[K]) {
    setEditor(previous => previous && { ...previous, fields: { ...previous.fields, [key]: value } });
    setError('');
    setNotice('');
  }

  function goToSection(section: ArticleTab) {
    setTab(section);
    setPreview(false);
    focusCmsPanel(panel);
  }

  function openEditor(saved: ArticleRecord | null) {
    discardRecovery();
    lastOpened.current = saved?._id ?? 'new';
    suggestedSlug.current = '';
    setEditor(editorFor(saved));
    setTab('details');
    setPreview(false);
    if (requirements.current) requirements.current.open = false;
    setError('');
    setNotice('');
  }

  function discardRecovery() {
    unsavedArticles.delete(user._id);
    setRecovery(undefined);
  }

  async function perform(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (problem) {
      setError(errorMessage(problem, 'درخواست انجام نشد. دوباره تلاش کنید.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function acceptSaved(saved: ArticleRecord, unsaved?: ArticleFields) {
    const next = editorFor(saved);
    setEditor(unsaved ? { ...next, fields: unsaved } : next);
    setItems(current => [saved, ...current.filter(item => item._id !== saved._id)]);
  }

  function select(article: ArticleSummary, reload = false) {
    if ((!reload && record?._id === article._id) || !canClose()) return;
    void perform(async () => {
      const saved = await apiFetch<ArticleRecord>('/articles/' + article._id, token);
      openEditor(saved);
      setItems(current => current.map(item => item._id === saved._id ? saved : item));
    });
  }

  function validateDraft(payload: ArticleFields) {
    if (!payload.title || !slugPattern.test(payload.slug)) {
      goToSection('details');
      return !payload.title ? 'عنوان مقاله را وارد کنید.' : 'نشانی را با حروف کوچک انگلیسی، عدد و خط تیره بنویسید.';
    }
    if (payload.tags.length > 10 || payload.tags.some(tag => tag.length > 60)) {
      goToSection('details');
      return 'تا ۱۰ برچسب و برای هر برچسب تا ۶۰ نویسه وارد کنید.';
    }
    if (payload.takeaways.length > 5 || payload.takeaways.some(takeaway => takeaway.length > 350)) {
      goToSection('intro');
      return 'تا ۵ نکتهٔ کلیدی و برای هر نکته تا ۳۵۰ نویسه وارد کنید.';
    }
    const ids = payload.sections.map(section => section.id);
    if (ids.some(id => !slugPattern.test(id)) || new Set(ids).size !== ids.length) {
      goToSection('body');
      return 'برای هر بخش یک شناسهٔ انگلیسی یکتا وارد کنید.';
    }
    if (payload.bodyImage && payload.bodyImageAfter && !ids.includes(payload.bodyImageAfter)) {
      goToSection('media');
      return 'محل نمایش تصویر داخل مقاله را دوباره انتخاب کنید.';
    }
  }

  function save(publish = false) {
    if (!fields || (!dirty && !publish)) return;
    const title = fields.title.trim();
    if (!record && title && !fields.slug.trim() && !suggestedSlug.current) {
      suggestedSlug.current = newCmsSlug('article', title);
    }
    const cleanLines = (values: string[]) => values.map(value => value.trim()).filter(Boolean);
    const payload = {
      ...fields,
      slug: fields.slug.trim() || (!record ? suggestedSlug.current : ''),
      title,
      tags: cleanLines(fields.tags),
      takeaways: cleanLines(fields.takeaways),
      sections: fields.sections.map(section => ({ ...section, id: section.id.trim() })),
      bodyImageAfter: (fields.bodyImageAfter ?? fields.sections[1]?.id ?? '').trim(),
      sources: fields.sources.map(source => ({ ...source, url: source.url.trim() })),
    };
    const problem = validateDraft(payload);
    if (problem) {
      setError(problem);
      return;
    }
    if (publish && publishChecklist(payload, words).length) {
      setError('');
      setNotice('');
      showCmsChecklist(requirements);
      return;
    }
    void perform(async () => {
      let saved = record;
      if (!saved || dirty) {
        saved = await apiFetch<ArticleRecord>(saved ? '/articles/' + saved._id : '/articles', token, {
          method: saved ? 'PATCH' : 'POST',
          headers: saved ? versionHeader(saved) : undefined,
          body: JSON.stringify(payload),
        });
        acceptSaved(saved);
        setNotice(saved.status === 'published' ? 'ویرایش در پیش‌نویس ذخیره شد.' : 'پیش‌نویس ذخیره شد.');
      }
      if (publish) {
        const published = await apiFetch<ArticleRecord>('/articles/' + saved._id + '/status', token, {
          method: 'PATCH', headers: versionHeader(saved), body: JSON.stringify({ status: 'published' }),
        });
        acceptSaved(published);
        setNotice('مقاله در سایت منتشر شد.');
        if (requirements.current) requirements.current.open = false;
      }
    });
  }

  function withdraw() {
    if (!record || !window.confirm('نمایش این مقاله در سایت متوقف شود؟ متن در پیش‌نویس می‌ماند.')) return;
    void perform(async () => {
      const saved = await apiFetch<ArticleRecord>('/articles/' + record._id + '/status', token, {
        method: 'PATCH', headers: versionHeader(record), body: JSON.stringify({ status: 'draft' }),
      });
      acceptSaved(saved, dirty ? fields : undefined);
      setNotice('نمایش مقاله در سایت متوقف شد.');
    });
  }

  function remove() {
    if (!record || record.status !== 'draft' || !window.confirm('این پیش‌نویس برای همیشه حذف شود؟')) return;
    void perform(async () => {
      await apiFetch('/articles/' + record._id, token, { method: 'DELETE', headers: versionHeader(record) });
      discardRecovery();
      setItems(current => current.filter(article => article._id !== record._id));
      setEditor(null);
      setNotice('پیش‌نویس حذف شد.');
    });
  }

  function upload(slot: ArticleMediaTarget, file: File) {
    if (!fields) return;
    void perform(async () => {
      const slotName = typeof slot === 'string' ? slot : `section-${slot.sectionIndex + 1}`;
      const asset = await uploadMedia(token, file, 'general', ['article', fields.slug || 'draft', slotName].join('-'));
      const image = { key: asset.key, alt: '' };
      if (typeof slot === 'string') {
        change(slot, image);
      } else {
        change('sections', fields.sections.map((section, index) =>
          index === slot.sectionIndex ? { ...section, image } : section));
      }
      setNotice('تصویر به مخزن اضافه شد. متن جایگزین آن را بنویسید و پیش‌نویس را ذخیره کنید.');
    });
  }

  function addArticle() {
    if (canClose()) openEditor(null);
  }

  return (
    <div className="article-cms">
      {recovery && (
        <div className="admin-alert article-inline-alert">
          <p>ویرایش ذخیره‌نشدهٔ «{recovery.fields.title.trim() || 'مقالهٔ جدید'}» در این تب باقی مانده است.</p>
          <div className="admin-actions">
            <button type="button" className="admin-button admin-button--secondary" disabled={busy} onClick={() => {
              lastOpened.current = recovery.saved?._id ?? 'new';
              setEditor(recovery);
              setRecovery(undefined);
              setTab('details');
              setPreview(false);
            }}>ادامهٔ ویرایش</button>
            <button type="button" className="admin-button admin-button--danger" disabled={busy} onClick={() => {
              if (canClose()) discardRecovery();
            }}>کنار گذاشتن</button>
          </div>
        </div>
      )}
      {!fields && error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
      {!fields && notice && <p className="admin-alert" role="status">{notice}</p>}
      <div className="article-workspace" aria-busy={busy}>
        <div hidden={!!fields}>
          <ArticleArchive items={items} loadState={loadState} loadError={loadError} archive={archive}
            busy={busy} onSelect={select} onRetry={() => void loadArchive()} onNew={addArticle} />
        </div>
        {fields && (
          <div className="article-editor">
            <button type="button" className="cms-workspace-back" disabled={busy} onClick={() => {
              if (!canClose()) return;
              discardRecovery();
              setEditor(null);
              setError('');
              setNotice('');
            }}><AdminIcon name="arrow" size={17} /> فهرست مقالات</button>
            <header className="admin-panel article-editor-header">
              <div>
                <p className="article-kicker">{record ? 'ویرایش مقاله' : 'مقالهٔ جدید'}</p>
                <h2 ref={editorHeading} tabIndex={-1}>{fields.title.trim() || 'مقالهٔ بدون عنوان'}</h2>
                <div className="article-editor-meta">
                  <StatusChip article={record ?? { status: 'draft', hasUnpublishedChanges: false }} />
                  <span>{formatNumber(words)} کلمه</span>
                </div>
              </div>
              <div className="admin-actions">
                {record?.status === 'published' && <a className="admin-button admin-button--secondary"
                  href={siteOrigin + '/articles/' + record.slug} target="_blank" rel="noreferrer">
                  نسخهٔ سایت <AdminIcon name="external" size={16} />
                </a>}
                <button type="button" className="admin-button admin-button--secondary" aria-pressed={preview}
                  disabled={busy} onClick={() => setPreview(current => !current)}>
                  <AdminIcon name={preview ? 'eye-off' : 'eye'} size={17} />{preview ? 'بازگشت به ویرایش' : 'پیش‌نمایش پیش‌نویس'}
                </button>
              </div>
            </header>

            <fieldset className="article-editor-controls" disabled={busy}>
              <CmsPublishChecklist issues={publishChecklist(fields, words, !record)} sections={tabs} detailsRef={requirements} onSelect={goToSection} />
              <div hidden={preview}>
                <CmsSections sections={tabs} current={tab} onSelect={setTab} label="بخش‌های ویرایشگر مقاله" panel={panel} disabled={busy}>
                  {tab === 'details' && <ArticleDetails fields={fields} change={change} lockedSlug={!!record?.publishedAt} isNew={!record} />}
                  {tab === 'intro' && <ArticleIntro fields={fields} change={change} />}
                  {tab === 'body' && <ArticleBody fields={fields} change={change} onUpload={upload} />}
                  {tab === 'media' && <ArticleMedia fields={fields} change={change} onUpload={upload} />}
                  {tab === 'faq' && <ArticleQuestions fields={fields} change={change} />}
                  {tab === 'sources' && <ArticleSources fields={fields} change={change} />}
                  {tab === 'seo' && <ArticleSeo fields={fields} change={change} />}
                  {tab === 'relations' && <ArticleRelations fields={fields} change={change} articles={items} recipes={recipes}
                    recipeStatus={recipeState} onRetryRecipes={() => void loadRecipes()} />}
                </CmsSections>
              </div>
              {preview && <ArticlePreview fields={fields} words={words} articles={items} recipes={recipes} />}
              {record && (
                <details className="cms-manage">
                  <summary>مدیریت نسخه</summary>
                  <div className="admin-actions">
                    <button type="button" className="admin-button admin-button--secondary" onClick={() => select(record, true)}>بارگیری نسخهٔ ذخیره‌شده</button>
                    {record.status === 'published'
                      ? <button type="button" className="admin-button admin-button--danger" onClick={withdraw}>برداشتن از سایت</button>
                      : <button type="button" className="admin-button admin-button--danger" onClick={remove}>حذف پیش‌نویس</button>}
                  </div>
                </details>
              )}
              <CmsEditorToolbar record={record} dirty={dirty} working={busy} error={error} notice={notice}
                onSave={() => save()} onPublish={() => save(true)} />
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArticlesAdmin() {
  return (
    <AppShell title="مقالات">
      <ArticleWorkspace />
    </AppShell>
  );
}
