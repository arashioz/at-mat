import { useId, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from 'react';
import { PAGE_TEXT_MAX_LENGTH } from '../../backend/src/common/content-copy';
import { AdminSearch, faCount, normalizeQuery } from './AdminForms';
import { AdminIcon } from './AdminIcon';

export function focusCmsPanel(panel: RefObject<HTMLElement>) {
  requestAnimationFrame(() => {
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: 'start' });
  });
}

export function CmsSections<Id extends string>({ sections, current, onSelect, label, disabled, panel, children }: {
  sections: readonly { id: Id; label: string }[];
  current: Id;
  onSelect: (id: Id) => void;
  label: string;
  disabled?: boolean;
  panel: RefObject<HTMLDivElement>;
  children: ReactNode;
}) {
  const contentId = useId();
  const nav = useRef<HTMLElement>(null);
  const index = sections.findIndex(section => section.id === current);
  const previous = sections[index - 1];
  const next = sections[index + 1];
  const progress = `${faCount(index + 1)} از ${faCount(sections.length)}`;

  function select(id: Id, fromFooter = false) {
    onSelect(id);
    const panelTop = panel.current?.getBoundingClientRect().top;
    const navTop = nav.current?.getBoundingClientRect().top;
    if (fromFooter || (panelTop !== undefined && navTop !== undefined && panelTop < navTop - 1)) focusCmsPanel(panel);
  }

  return (
    <div className="cms-editor-layout">
      <nav className="cms-section-nav" aria-label={label} ref={nav}>
        <p>بخش‌های ویرایش <small>{progress}</small></p>
        <label className="admin-field cms-section-select">
          <span>رفتن به بخش <small>{progress}</small></span>
          <select className="admin-input" value={current} aria-controls={contentId} disabled={disabled}
            onChange={event => {
              const section = sections.find(item => item.id === event.target.value);
              if (section) select(section.id);
            }}>
            {sections.map(section => <option key={section.id} value={section.id}>{section.label}</option>)}
          </select>
        </label>
        <div className="cms-section-links">
          {sections.map(section => (
            <button key={section.id} type="button" aria-controls={contentId} aria-pressed={current === section.id}
              disabled={disabled} onClick={() => select(section.id)}>
              {section.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="cms-section-pane">
        <div className="cms-section-content" id={contentId} role="region" aria-label={sections[index]?.label} ref={panel} tabIndex={-1}>{children}</div>
        <nav className="cms-section-steps" aria-label="بخش قبلی و بعدی">
          {previous && <button className="cms-step cms-step--previous" type="button" disabled={disabled} onClick={() => select(previous.id, true)}>
            <AdminIcon name="arrow" size={17} /><span><small>بخش قبلی</small><strong>{previous.label}</strong></span>
          </button>}
          {next && <button className="cms-step cms-step--next" type="button" disabled={disabled} onClick={() => select(next.id, true)}>
            <span><small>بخش بعدی</small><strong>{next.label}</strong></span><AdminIcon name="arrow" size={17} />
          </button>}
        </nav>
      </div>
    </div>
  );
}

export function CmsPublishChecklist<Id extends string>({ issues, sections, detailsRef, onSelect, disabled }: {
  issues: readonly { section: Id; label: string }[];
  sections: readonly { id: Id; label: string }[];
  detailsRef: RefObject<HTMLDetailsElement>;
  onSelect: (id: Id) => void;
  disabled?: boolean;
}) {
  return (
    <details className="cms-checklist" ref={detailsRef}>
      <summary>آمادگی برای انتشار <span>{issues.length ? `${faCount(issues.length)} مورد باقی مانده` : 'آماده'}</span></summary>
      {issues.length ? (
        <ul>
          {sections.map(section => {
            const labels = issues.filter(issue => issue.section === section.id).map(issue => issue.label);
            return labels.length > 0 && <li key={section.id}>
              <button type="button" disabled={disabled} onClick={() => {
                if (detailsRef.current) detailsRef.current.open = false;
                onSelect(section.id);
              }}>
                <span><strong>{section.label}</strong><small>{labels.join('، ')}</small></span>
                <span className="cms-edit-action">ویرایش <AdminIcon name="arrow" size={16} /></span>
              </button>
            </li>;
          })}
        </ul>
      ) : <p className="admin-muted">موارد لازم برای انتشار کامل‌اند.</p>}
    </details>
  );
}

export function showCmsChecklist(details: RefObject<HTMLDetailsElement>) {
  if (!details.current) return;
  details.current.open = true;
  details.current.querySelector('summary')?.focus({ preventScroll: true });
  details.current.scrollIntoView({ block: 'start' });
}

export function CmsEditorToolbar({ record, dirty, working, error, notice, onSave, onPublish }: {
  record?: { status: 'draft' | 'published'; hasUnpublishedChanges: boolean } | null;
  dirty: boolean;
  working: boolean;
  error: string;
  notice: string;
  onSave: () => void;
  onPublish: () => void;
}) {
  const published = record?.status === 'published';
  const pending = record?.hasUnpublishedChanges;
  const canPublish = dirty || Boolean(record && (!published || pending));
  const status = working ? 'در حال انجام…'
    : dirty ? 'تغییرات ذخیره نشده‌اند.'
    : pending ? 'نسخهٔ تازه آمادهٔ بازبینی است.'
    : published ? 'آخرین نسخه روی سایت است.'
    : record ? 'پیش‌نویس ذخیره شده است.' : 'با وارد کردن عنوان شروع کنید.';

  return (
    <div className="admin-editor-toolbar cms-toolbar">
      {(error || notice) && <div className="cms-toolbar-feedback">
        {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
        {notice && <p className="admin-alert" role="status">{notice}</p>}
      </div>}
      <p className="admin-muted" aria-live="polite">{status}</p>
      <div className="admin-actions">
        <button type="button" className="admin-button admin-button--secondary" disabled={working || !dirty} onClick={onSave}>ذخیرهٔ پیش‌نویس</button>
        <button type="button" className="admin-button admin-button--primary" disabled={working || !canPublish} onClick={onPublish}>
          {dirty ? 'ذخیره و انتشار' : published ? 'انتشار تغییرات' : 'انتشار روی سایت'}
        </button>
      </div>
    </div>
  );
}

export function CmsTextSettings<Key extends string>({ defaults, overrides, fields, onChange }: {
  defaults: Record<Key, string>;
  overrides?: Partial<Record<Key, string>>;
  fields: readonly { key: Key; label: string; rows?: number }[];
  onChange: (value: Partial<Record<Key, string>>) => void;
}) {
  return (
    <details className="cms-text-settings">
      <summary>عنوان‌ها و متن روی سایت</summary>
      <div className="cms-text-fields">
        <p className="admin-muted">فیلد خالی با متن پیش‌فرض نمایش داده می‌شود.</p>
        {fields.map(({ key, label, rows }) => {
          function update(value: string) {
            const next: Partial<Record<Key, string>> = { ...overrides };
            if (value === defaults[key]) delete next[key];
            else next[key] = value;
            onChange(next);
          }
          const props = {
            className: 'admin-input',
            maxLength: PAGE_TEXT_MAX_LENGTH,
            value: overrides?.[key] ?? defaults[key],
            onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(event.target.value),
          };
          return <label className="admin-field" key={String(key)}>
            <span>{label}</span>
            {rows ? <textarea {...props} rows={rows} /> : <input {...props} />}
          </label>;
        })}
      </div>
    </details>
  );
}

export type CmsRelationChoice = { slug: string; title: string; status?: 'draft' | 'published' };

export function CmsPreviewLinks({ title, label, items, baseUrl }: {
  title: string;
  label?: string;
  items: readonly CmsRelationChoice[];
  baseUrl: string;
}) {
  if (!items.length) return null;
  return (
    <section className="cms-preview-links">
      {label && <p>{label}</p>}
      <h4>{title.replace(/\n/g, ' ')}</h4>
      <ul>{items.map(item => <li key={item.slug}>
        <a href={`${baseUrl}/${encodeURIComponent(item.slug)}`} target="_blank" rel="noreferrer">{item.title}</a>
      </li>)}</ul>
    </section>
  );
}

export function CmsRelations({ label, choices, selected, onChange }: {
  label: string;
  choices: readonly CmsRelationChoice[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const bySlug = new Map(choices.map(choice => [choice.slug, choice]));
  const missing = selected.filter(slug => !bySlug.has(slug)).map(slug => ({ slug, title: slug, status: undefined }));
  const term = normalizeQuery(search);
  const results = [...choices, ...missing].filter(choice => normalizeQuery(`${choice.title} ${choice.slug}`).includes(term));

  function move(index: number, offset: number) {
    const next = [...selected];
    const target = index + offset;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <fieldset className="cms-relation">
      <legend>{label} <small>{faCount(selected.length)} از ۶</small></legend>
      {choices.length > 6 && <AdminSearch label={`جست‌وجو در ${label}`} value={search} onChange={setSearch} />}
      {results.length === 0 && <p className="admin-muted">موردی برای انتخاب نیست.</p>}
      <div className="cms-relation-options">
        {results.map(choice => {
          const checked = selected.includes(choice.slug);
          return (
            <label key={choice.slug}>
              <input type="checkbox" checked={checked} disabled={!checked && selected.length >= 6}
                onChange={event => onChange(event.target.checked ? [...selected, choice.slug] : selected.filter(slug => slug !== choice.slug))} />
              <span>{choice.title}{choice.status === 'draft' && <small>پیش‌نویس</small>}</span>
            </label>
          );
        })}
      </div>
      {selected.length > 1 && <ol className="cms-relation-order" aria-label={`ترتیب نمایش ${label}`}>
        {selected.map((slug, index) => (
          <li key={slug}>
            <span>{faCount(index + 1)}. {bySlug.get(slug)?.title ?? slug}</span>
            <div>
              <button type="button" className="admin-icon-button" disabled={index === 0}
                aria-label={`بالاتر بردن ${bySlug.get(slug)?.title ?? slug}`} onClick={() => move(index, -1)}>↑</button>
              <button type="button" className="admin-icon-button" disabled={index === selected.length - 1}
                aria-label={`پایین‌تر بردن ${bySlug.get(slug)?.title ?? slug}`} onClick={() => move(index, 1)}>↓</button>
            </div>
          </li>
        ))}
      </ol>}
    </fieldset>
  );
}
