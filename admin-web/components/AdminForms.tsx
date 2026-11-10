'use client';

import { AdminIcon } from './AdminIcon';

export const faCount = (value: number) => value.toLocaleString('fa-IR');
export const normalizeQuery = (text: string) => text.toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u064b-\u065f]/g, ' ').replace(/\s+/g, ' ').trim();

export function AdminSearch({ value, onChange, label, placeholder }: { value: string; onChange: (value: string) => void; label: string; placeholder?: string }) {
  return (
    <label className="at-search-control admin-search">
      <AdminIcon name="search" size={19} />
      <span className="sr-only">{label}</span>
      <input type="search" value={value} placeholder={placeholder ?? label} onChange={event => onChange(event.target.value)} />
    </label>
  );
}

export function CollectionState({ loading, error, empty, onRetry }: { loading: boolean; error: string; empty?: string; onRetry: () => void }) {
  if (loading) return <p className="admin-muted" role="status">در حال دریافت اطلاعات…</p>;
  if (error) return <div className="admin-empty"><p className="admin-alert admin-alert--error" role="alert">{error}</p><button type="button" className="admin-button admin-button--secondary" onClick={onRetry}>تلاش دوباره</button></div>;
  return empty ? <p className="admin-list-empty">{empty}</p> : null;
}
