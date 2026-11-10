'use client';

import { useEffect, useRef, useState } from 'react';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { AdminSearch, normalizeQuery } from '../../components/AdminForms';
import { AdminIcon } from '../../components/AdminIcon';
import { RecipeEditor, RecipeStatus } from '../../components/recipes/RecipeEditor';
import { apiFetch } from '../../lib/api';
import { RECIPE_FLAVORS, recipeSummary, unsavedRecipeWork, type RecipeDetail, type RecipeSummary, type RecipeWork } from '../../lib/recipes';
import './recipes-admin.css';

const FILTERS = [
  { id: 'all', label: 'همهٔ رسپی‌ها' },
  { id: 'published', label: 'منتشرشده' },
  { id: 'draft', label: 'پیش‌نویس' },
  { id: 'pending', label: 'در انتظار انتشار' },
] as const;
type Filter = typeof FILTERS[number]['id'];
type OpenRecipe = { record: RecipeDetail | null; recovered?: RecipeWork };

const normalize = (value: string) => normalizeQuery(value.replace(/-/g, ' '));

function RecipeLibrary() {
  const { token, user } = useAdminWorkspace();
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);
  const [editor, setEditor] = useState<OpenRecipe | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [reload, setReload] = useState(0);
  const [recovery, setRecovery] = useState(() => unsavedRecipeWork.get(user._id));
  const panel = useRef<HTMLElement>(null);
  const lastOpened = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    void apiFetch<RecipeSummary[]>('/recipes', token, { signal: controller.signal })
      .then(setRecipes)
      .catch(err => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'فهرست رسپی‌ها دریافت نشد.');
      });
    return () => controller.abort();
  }, [token, reload]);

  useEffect(() => {
    if (editor || lastOpened.current === null) return;
    panel.current?.querySelector<HTMLButtonElement>(`[data-recipe-open="${CSS.escape(lastOpened.current)}"]`)?.focus();
    lastOpened.current = null;
  }, [editor]);

  function discardRecovery() {
    unsavedRecipeWork.delete(user._id);
    setRecovery(undefined);
  }

  function canStart() {
    if (recovery && !window.confirm('ویرایش ذخیره‌نشدهٔ قبلی کنار گذاشته شود؟')) return false;
    discardRecovery();
    return true;
  }

  async function openRecipe(slug: string) {
    if (opening || !canStart()) return;
    setOpening(slug);
    setError('');
    try {
      const record = await apiFetch<RecipeDetail>(`/recipes/${encodeURIComponent(slug)}`, token);
      lastOpened.current = slug;
      setEditor({ record });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'رسپی باز نشد.');
    } finally {
      setOpening(null);
    }
  }

  function updateSummary(recipe: RecipeDetail) {
    const summary = recipeSummary(recipe);
    setRecipes(previous => {
      const items = previous ?? [];
      return items.some(item => item.slug === recipe.slug)
        ? items.map(item => item.slug === recipe.slug ? summary : item)
        : [...items, summary];
    });
  }

  const items = recipes ?? [];
  if (editor) {
    return (
      <RecipeEditor
        initial={editor.record}
        recovered={editor.recovered}
        recipes={items}
        categories={[...new Set(items.map(item => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fa-IR'))}
        onBack={() => setEditor(null)}
        onSaved={updateSummary}
      />
    );
  }

  const counts = {
    all: items.length,
    published: items.filter(item => item.status === 'published').length,
    draft: items.filter(item => item.status === 'draft').length,
    pending: items.filter(item => item.hasUnpublishedChanges).length,
  };
  const query = normalize(search);
  const visible = items.filter(item => {
    const matchesStatus = filter === 'all' || (filter === 'pending' ? item.hasUnpublishedChanges : item.status === filter);
    const flavor = RECIPE_FLAVORS.find(([key]) => key === item.flavor)?.[1] ?? '';
    return matchesStatus && normalize([item.title, item.slug, item.category, flavor].join(' ')).includes(query);
  });

  return (
    <section ref={panel} className="admin-panel recipe-library" aria-labelledby="recipe-library-title" aria-busy={Boolean(opening) || (!recipes && !error)}>
      <header className="recipe-library__head">
        <div>
          <h2 id="recipe-library-title">کتابخانهٔ رسپی‌ها</h2>
          <p className="recipe-muted">رسپی‌های آشپزخانهٔ ات‌مت را جست‌وجو و ویرایش کنید.</p>
        </div>
        <button
          type="button"
          className="admin-button admin-button--primary"
          data-recipe-open=""
          disabled={Boolean(opening) || recipes === null}
          onClick={() => {
            if (!canStart()) return;
            setError('');
            lastOpened.current = '';
            setEditor({ record: null });
          }}
        >
          <AdminIcon name="plus" size={17} /> رسپی تازه
        </button>
      </header>
      {recovery && (
        <div className="admin-alert recipe-library__error">
          <p>ویرایش ذخیره‌نشدهٔ «{recovery.draft.title.trim() || recovery.slug || 'رسپی تازه'}» در این تب باقی مانده است.</p>
          <div className="admin-actions">
            <button type="button" className="admin-button admin-button--secondary" disabled={!recipes || Boolean(opening)} onClick={() => {
              lastOpened.current = recovery.record?.slug ?? '';
              setEditor({ record: recovery.record, recovered: recovery });
              setRecovery(undefined);
            }}>ادامهٔ ویرایش</button>
            <button type="button" className="admin-button admin-button--danger" onClick={() => {
              if (window.confirm('ویرایش ذخیره‌نشده کنار گذاشته شود؟')) discardRecovery();
            }}>کنار گذاشتن</button>
          </div>
        </div>
      )}
      {error && (
        <div className="admin-alert admin-alert--error recipe-library__error" role="alert">
          <p>{error}</p>
          {recipes === null && <button type="button" className="admin-button admin-button--secondary" onClick={() => setReload(value => value + 1)}>تلاش دوباره</button>}
        </div>
      )}
      {!recipes && !error && <p className="admin-empty" role="status">در حال دریافت رسپی‌ها…</p>}
      {recipes && <>
        <div className="recipe-library__search">
          <AdminSearch label="جست‌وجوی رسپی" value={search} onChange={setSearch} placeholder="نام رسپی، دسته، طعم یا شناسهٔ آدرس" />
        </div>
        <div className="recipe-library__filters" role="group" aria-label="فیلتر وضعیت انتشار">
          {FILTERS.map(item => (
            <button key={item.id} className="at-pill" type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
              {item.label} <span>{counts[item.id].toLocaleString('fa-IR')}</span>
            </button>
          ))}
        </div>
        {opening && <p className="recipe-muted" role="status">در حال باز کردن رسپی…</p>}
        <p className="recipe-library__count" aria-live="polite">{visible.length.toLocaleString('fa-IR')} رسپی</p>
        {visible.length > 0 ? (
          <ul className="recipe-library__list">
            {visible.map(item => {
              const flavor = RECIPE_FLAVORS.find(([key]) => key === item.flavor)?.[1];
              return (
                <li key={item.slug}>
                  <button className="recipe-library__item" type="button" data-recipe-open={item.slug} disabled={Boolean(opening)} onClick={() => void openRecipe(item.slug)}>
                    <span className="recipe-number" aria-hidden="true">{item.number}</span>
                    <span className="recipe-library__label">
                      <strong>{item.title.trim() || 'رسپی بدون نام'}</strong>
                      <span>{[item.category, flavor].filter(Boolean).join(' · ') || <bdi dir="ltr">{item.slug}</bdi>}</span>
                    </span>
                    <RecipeStatus status={item.status} pending={item.hasUnpublishedChanges} />
                    <span className="recipe-library__arrow cms-edit-action" aria-hidden="true">ویرایش <AdminIcon name="arrow" size={16} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="admin-empty">
            <p>{items.length ? 'رسپی با این جست‌وجو و وضعیت پیدا نشد.' : 'هنوز رسپی‌ای ثبت نشده است.'}</p>
            {(search || filter !== 'all') && <button type="button" className="admin-button admin-button--secondary" onClick={() => {
              setSearch(''); setFilter('all');
            }}>پاک‌کردن فیلترها</button>}
          </div>
        )}
      </>}
    </section>
  );
}

export default function RecipesPage() {
  return (
    <AppShell title="رسپی‌ها">
      <RecipeLibrary />
    </AppShell>
  );
}
