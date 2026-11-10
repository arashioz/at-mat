import { useEffect, useRef, useState } from 'react';
import { SITE_URL } from '../../lib/media';
import { apiFetch } from '../../lib/api';
import { newCmsSlug } from '../../lib/cms';
import { recipePublicationIssues } from '../../../backend/src/recipes/recipe-publication';
import {
  changeRecipePublication, emptyRecipe, RECIPE_SLUG_PATTERN, saveRecipeDraft, unsavedRecipeWork,
  type RecipeArticleChoice, type RecipeDetail, type RecipeFields, type RecipePhoto, type RecipePhotoSlot, type RecipeSummary, type RecipeWork,
} from '../../lib/recipes';
import { useAdminWorkspace } from '../AppShell';
import { AdminIcon } from '../AdminIcon';
import { CmsEditorToolbar, CmsPublishChecklist, CmsSections, focusCmsPanel, showCmsChecklist } from '../CmsEditor';
import {
  RecipeBasics, RecipeExtraSections, RecipeIngredients, RecipeIntro, RecipeMethod,
  RecipeNutrition, RecipeQuestions, RecipeRelations, RecipeSeo,
} from './RecipeFields';
import { RecipeMedia } from './RecipeMedia';
import { RecipePreview } from './RecipePreview';

const EDITOR_TABS = [
  { id: 'basics', label: 'مشخصات', description: 'نام، نشانی، دسته‌بندی و طعم رسپی.' },
  { id: 'intro', label: 'معرفی و زمان', description: 'معرفی رسپی، زمان آماده‌سازی و پخت، تعداد وعده و درجهٔ سختی.' },
  { id: 'ingredients', label: 'مواد لازم', description: 'نام، مقدار و ترتیب مواد را تنظیم کنید.' },
  { id: 'method', label: 'مراحل و نکته‌ها', description: 'آماده‌سازی، مراحل پخت و نکتهٔ پایانی.' },
  { id: 'extra', label: 'بخش‌های تکمیلی', description: 'برای سرو، نگهداری یا جایگزین مواد، بخش جداگانه بسازید.' },
  { id: 'nutrition', label: 'ارزش غذایی', description: 'مقدار هر وعده، جدول ارزش غذایی و یادداشت‌های آن.' },
  { id: 'faq', label: 'پرسش‌ها', description: 'پرسش و پاسخ‌های متداول را ویرایش و مرتب کنید.' },
  { id: 'media', label: 'تصاویر', description: 'کاور، تصاویر مراحل و کپشن‌های سایت.' },
  { id: 'seo', label: 'سئو', description: 'عنوان و توضیحی که برای نتیجهٔ جست‌وجو ثبت می‌شوند.' },
  { id: 'relations', label: 'محتوای مرتبط', description: 'مقاله‌ها و رسپی‌های پیشنهادی و ترتیب نمایش آن‌ها.' },
] as const;

type EditorTab = typeof EDITOR_TABS[number]['id'];
const DISCARD_MESSAGE = 'تغییرات این رسپی ذخیره نشده‌اند. از ویرایش خارج می‌شوید؟';
const formatDate = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function RecipeStatus({ status, pending }: { status: RecipeDetail['status']; pending?: boolean }) {
  return (
    <span className="recipe-status">
      <span className={`admin-chip admin-chip--${status === 'published' ? 'live' : 'draft'}`}>
        {status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
      </span>
      {pending && <span className="admin-chip admin-chip--draft">ویرایش در انتظار انتشار</span>}
    </span>
  );
}

function useRecipeLeaveGuard(dirty: boolean, working: boolean, userId: string) {
  useEffect(() => {
    if (!dirty && !working) return;

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = '';
    }

    function onLinkClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : null;
      const link = element?.closest<HTMLAnchorElement>('a[href]');
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      const next = new URL(link.href, window.location.href);
      if (next.origin === location.origin && next.pathname === location.pathname && next.search === location.search) return;
      if (working || !window.confirm(DISCARD_MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        unsavedRecipeWork.delete(userId);
      }
    }

    function onLeave(event: Event) {
      if (working || !window.confirm(DISCARD_MESSAGE)) event.preventDefault();
      else unsavedRecipeWork.delete(userId);
    }

    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('atmat:before-leave', onLeave);
    document.addEventListener('click', onLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('atmat:before-leave', onLeave);
      document.removeEventListener('click', onLinkClick, true);
    };
  }, [dirty, working, userId]);
}

export function RecipeEditor({
  initial, recovered, categories, recipes, onBack, onSaved,
}: {
  initial: RecipeDetail | null;
  recovered?: RecipeWork;
  categories: string[];
  recipes: RecipeSummary[];
  onBack: () => void;
  onSaved: (recipe: RecipeDetail) => void;
}) {
  const { token, user } = useAdminWorkspace();
  const [record, setRecord] = useState(initial);
  const [draft, setDraft] = useState(() => recovered?.draft ?? initial?.draft ?? emptyRecipe());
  const [slug, setSlug] = useState(recovered?.slug ?? initial?.slug ?? '');
  const [tab, setTab] = useState<EditorTab>('basics');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [articles, setArticles] = useState<RecipeArticleChoice[] | null>(null);
  const [articleError, setArticleError] = useState(false);
  const [articleRetry, setArticleRetry] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const checklist = useRef<HTMLDetailsElement>(null);
  const inFlight = useRef(false);
  const suggestedSlug = useRef('');
  const working = busy || mediaBusy;
  const dirty = (!record && Boolean(slug)) || JSON.stringify(draft) !== JSON.stringify(record?.draft ?? emptyRecipe());
  const section = EDITOR_TABS.find(item => item.id === tab)!;
  const publicationIssues = recipePublicationIssues(draft);
  const updated = record?.updatedAt ? new Date(record.updatedAt) : null;
  const wantsArticles = tab === 'relations' || preview;
  useRecipeLeaveGuard(dirty, working, user._id);

  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    if (!wantsArticles || articles) return;
    const controller = new AbortController();
    setArticleError(false);
    void apiFetch<RecipeArticleChoice[]>('/articles?summary=1', token, { signal: controller.signal })
      .then(rows => { if (!controller.signal.aborted) setArticles(rows); })
      .catch(() => { if (!controller.signal.aborted) setArticleError(true); });
    return () => controller.abort();
  }, [wantsArticles, token, articles, articleRetry]);
  useEffect(() => {
    if (dirty) unsavedRecipeWork.set(user._id, { record, draft, slug });
    else unsavedRecipeWork.delete(user._id);
  }, [dirty, record, draft, slug, user._id]);

  function back() {
    if (dirty && !window.confirm(DISCARD_MESSAGE)) return;
    unsavedRecipeWork.delete(user._id);
    onBack();
  }

  function update<Key extends keyof RecipeFields>(key: Key, value: RecipeFields[Key]) {
    setDraft(current => ({ ...current, [key]: value }));
    setError('');
    setNotice('');
  }

  function updatePhoto(slot: RecipePhotoSlot, photo: RecipePhoto | null) {
    setDraft(current => {
      const photos = { ...current.photos };
      if (photo) photos[slot] = photo;
      else delete photos[slot];
      return { ...current, photos };
    });
    setError('');
    setNotice('');
  }

  function acceptSaved(next: RecipeDetail, message: string) {
    unsavedRecipeWork.delete(user._id);
    setRecord(next);
    setDraft(next.draft);
    setSlug(next.slug);
    onSaved(next);
    setNotice(message);
  }

  async function run(action: () => Promise<void>) {
    if (inFlight.current || mediaBusy) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'درخواست انجام نشد.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function goToSection(id: EditorTab) {
    setPreview(false);
    setTab(id);
    focusCmsPanel(panel);
  }

  function save(publish = false) {
    if (working || (!dirty && !publish)) return;
    const title = draft.title.trim();
    if (!record && !title) {
      goToSection('basics');
      setError('نام رسپی را وارد کنید.');
      return;
    }
    if (!record && !slug.trim() && !suggestedSlug.current) {
      suggestedSlug.current = newCmsSlug('recipe', title);
    }
    const address = slug.trim() || (!record ? suggestedSlug.current : '');
    if (!RECIPE_SLUG_PATTERN.test(address) || address.length > 90) {
      goToSection('basics');
      setNotice('');
      setError('نشانی رسپی را با حروف کوچک انگلیسی، عدد و خط تیره بنویسید.');
      return;
    }
    if (publish && publicationIssues.length) {
      setError('');
      setNotice('');
      showCmsChecklist(checklist);
      return;
    }
    void run(async () => {
      let saved = record;
      if (!saved || dirty) {
        saved = await saveRecipeDraft(token, address, draft, saved);
        acceptSaved(saved, 'پیش‌نویس ذخیره شد.');
      }
      if (publish) {
        const published = await changeRecipePublication(token, saved, true);
        acceptSaved(published, 'رسپی روی سایت منتشر شد.');
        if (checklist.current) checklist.current.open = false;
      }
    });
  }

  function unpublish() {
    if (!record || dirty || working || !window.confirm('رسپی از سایت برداشته شود؟ پیش‌نویس برای ویرایش می‌ماند.')) return;
    void run(async () => {
      const saved = await changeRecipePublication(token, record, false);
      acceptSaved(saved, 'رسپی از انتشار خارج شد.');
    });
  }

  return (
    <div className="recipe-editor">
      <button
        type="button"
        className="cms-workspace-back"
        disabled={working}
        onClick={back}
      >
        <span aria-hidden="true"><AdminIcon name="arrow" size={17} /></span> فهرست رسپی‌ها
      </button>
      <section className="admin-panel recipe-editor__panel" aria-label="ویرایش رسپی">
        <header className="recipe-editor__header">
          <div>
            <div className="recipe-editor__identity">
              {record && <span className="recipe-number" aria-label={`رسپی شمارهٔ ${record.number}`}>{record.number}</span>}
              <h2 ref={heading} tabIndex={-1}>{draft.title.trim() || (record ? 'رسپی بدون نام' : 'رسپی تازه')}</h2>
            </div>
            <div className="recipe-editor__status">
              <RecipeStatus status={record?.status ?? 'draft'} pending={record?.hasUnpublishedChanges} />
              {updated && Number.isFinite(updated.getTime()) && <time dateTime={record?.updatedAt} className="recipe-muted">آخرین ذخیره {formatDate.format(updated)}</time>}
            </div>
          </div>
          <div className="admin-actions recipe-editor__header-actions">
            {record?.status === 'published' && (
              <a className="admin-button admin-button--secondary" href={`${SITE_URL}/recipes/${encodeURIComponent(record.slug)}`} target="_blank" rel="noreferrer">
                نسخهٔ سایت <AdminIcon name="external" size={16} />
              </a>
            )}
            <button type="button" className="admin-button admin-button--secondary" aria-pressed={preview} disabled={working} onClick={() => setPreview(current => !current)}>
              <AdminIcon name={preview ? 'eye-off' : 'eye'} size={17} /> {preview ? 'بازگشت به ویرایش' : 'پیش‌نمایش پیش‌نویس'}
            </button>
          </div>
        </header>

        <CmsPublishChecklist issues={publicationIssues} sections={EDITOR_TABS} detailsRef={checklist} onSelect={goToSection} disabled={working} />
        <div hidden={preview}>
          <CmsSections sections={EDITOR_TABS} current={tab} onSelect={setTab} label="بخش‌های ویرایش رسپی" panel={panel} disabled={working}>
            <fieldset disabled={working} className="recipe-editor__fields">
              <legend className="sr-only">{section.label}</legend>
              <div className="recipe-editor__section-heading">
                <h3>{section.label}</h3>
                <p>{section.description}</p>
              </div>
              {tab === 'basics' && <RecipeBasics draft={draft} update={update} slug={slug} setSlug={value => { setSlug(value); setError(''); setNotice(''); }} existing={Boolean(record)} categories={categories} />}
              {tab === 'intro' && <RecipeIntro draft={draft} update={update} />}
              {tab === 'ingredients' && <RecipeIngredients draft={draft} update={update} />}
              {tab === 'method' && <RecipeMethod draft={draft} update={update} />}
              {tab === 'extra' && <RecipeExtraSections draft={draft} update={update} />}
              {tab === 'nutrition' && <RecipeNutrition draft={draft} update={update} />}
              {tab === 'faq' && <RecipeQuestions draft={draft} update={update} />}
              {tab === 'media' && <RecipeMedia photos={draft.photos} title={draft.title} onChange={updatePhoto} onBusyChange={setMediaBusy} />}
              {tab === 'seo' && <RecipeSeo draft={draft} update={update} slug={slug} />}
              {tab === 'relations' && <RecipeRelations draft={draft} update={update} recipes={recipes.filter(item => item.slug !== slug)}
                articles={articles} articleError={articleError} onRetry={() => setArticleRetry(attempt => attempt + 1)} />}
            </fieldset>
          </CmsSections>
        </div>
        {preview && <RecipePreview draft={draft} number={record?.number} slug={slug} recipes={recipes} articles={articles ?? []} />}
        {record?.status === 'published' && <details className="cms-manage">
          <summary>مدیریت نسخه</summary>
          <div className="admin-actions">
            <button type="button" className="admin-button admin-button--danger" disabled={working || dirty} onClick={unpublish}>برداشتن از سایت</button>
            {dirty && <span className="recipe-muted">ابتدا تغییرات را ذخیره کنید.</span>}
          </div>
        </details>}
        <CmsEditorToolbar record={record} dirty={dirty} working={working} error={error} notice={notice}
          onSave={() => save()} onPublish={() => save(true)} />
      </section>
    </div>
  );
}
