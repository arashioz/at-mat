import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { faCount } from './AdminForms';
import { AdminIcon } from './AdminIcon';

export function CmsRows<T>({ title, itemLabel, addLabel, items, limit, makeItem, onChange, fields, summary, ordered = true, onRemove }: {
  title: string;
  itemLabel: string;
  addLabel: string;
  items: T[];
  limit: number;
  makeItem: () => T;
  onChange: (items: T[]) => void;
  fields: (item: T, change: (value: T) => void, index: number) => ReactNode;
  summary?: (item: T) => string;
  ordered?: boolean;
  onRemove?: (item: T) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const focus = useRef<{ index: number; field?: boolean } | null>(null);

  useLayoutEffect(() => {
    if (!focus.current) return;
    const { index, field } = focus.current;
    focus.current = null;
    const row = list.current?.children[index];
    const target = field || !summary ? row?.querySelector<HTMLElement>('input, textarea, select') : null;
    (target ?? row?.querySelector('button') ?? addButton.current)?.focus();
  });

  function move(index: number, offset: -1 | 1) {
    const neighbor = index + offset;
    const next = [...items];
    [next[index], next[neighbor]] = [next[neighbor], next[index]];
    if (open === index) setOpen(neighbor);
    focus.current = { index: neighbor };
    onChange(next);
  }

  function remove(index: number) {
    if (open === index) setOpen(null);
    focus.current = { index: Math.min(index, items.length - 2) };
    onChange(items.filter((_, i) => i !== index));
    onRemove?.(items[index]);
  }

  function add() {
    setOpen(items.length);
    focus.current = { index: items.length, field: true };
    onChange([...items, makeItem()]);
  }

  return (
    <section className="cms-rows" aria-labelledby={`${id}-heading`}>
      <div className="cms-rows-heading">
        <h4 id={`${id}-heading`}>{title} <span className="admin-chip">{faCount(items.length)}</span></h4>
        <button ref={addButton} type="button" className="admin-button admin-button--secondary" disabled={items.length >= limit} onClick={add}>
          <AdminIcon name="plus" size={16} />{addLabel}
        </button>
      </div>
      {!items.length && <p className="admin-muted">هنوز موردی اضافه نشده است.</p>}
      <ol ref={list} className="cms-rows-list">
        {items.map((item, index) => {
          const rowName = `${itemLabel} ${faCount(index + 1)}`;
          const expanded = !summary || open === index;
          const panelId = `${id}-row-${index}`;
          return (
            <li key={index} className={'cms-row' + (!summary ? ' cms-row--inline' : '')}>
              {summary && (
                <button type="button" className="cms-row-toggle" aria-expanded={expanded} aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : index)}>
                  <span className="cms-row-number" title={rowName}>{faCount(index + 1)}</span>
                  <span className="cms-row-title">{summary(item).trim() || rowName}</span>
                  <span className="cms-row-chevron" aria-hidden="true" />
                </button>
              )}
              <div className="cms-row-content" id={panelId} hidden={!expanded}>
                {expanded && <>
                  {!summary && <span className="cms-row-number" title={rowName}>{faCount(index + 1)}</span>}
                  <div className="cms-row-fields">{fields(item, value => onChange(items.map((previous, i) => i === index ? value : previous)), index)}</div>
                  <div className="cms-row-actions">
                    {ordered && <>
                      <button type="button" disabled={index === 0} aria-label={`بالاتر بردن ${rowName}`} title="بالاتر" onClick={() => move(index, -1)}>↑</button>
                      <button type="button" disabled={index === items.length - 1} aria-label={`پایین‌تر بردن ${rowName}`} title="پایین‌تر" onClick={() => move(index, 1)}>↓</button>
                    </>}
                    <button type="button" className="cms-row-remove" aria-label={`حذف ${rowName}`} onClick={() => remove(index)}>حذف</button>
                  </div>
                </>}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
