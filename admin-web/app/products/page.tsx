'use client';

import { useState, type FormEvent } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { AdminSearch, CollectionState, faCount, normalizeQuery } from '../../components/AdminForms';
import { AdminRecords, type AdminRecordColumn } from '../../components/AdminRecords';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { apiFetch, type Product } from '../../lib/api';
import { ADMIN_ROLES } from '../../lib/navigation';
import { useCollection } from '../../lib/use-collection';

const initial = { name: '', sku: '', category: '', unit: '', price: '', stock: '0', shelf: '' };
const columns: AdminRecordColumn<Product>[] = [
  { label: 'شناسه', value: item => <bdi>{item.sku}</bdi> },
  { label: 'دسته‌بندی', value: item => item.category || '—' },
  { label: 'قیمت (ریال)', value: item => faCount(item.price) },
  { label: 'موجودی', value: item => `${faCount(item.stockQuantity)} ${item.unit === 'piece' ? 'عدد' : item.unit}` },
  { label: 'ماندگاری', value: item => item.shelfLifeDays == null ? '—' : `${faCount(item.shelfLifeDays)} روز` },
];

function Products() {
  const { token, user } = useAdminWorkspace();
  const { items, setItems, loading, error, refresh } = useCollection<Product>('/products', token);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setSaveError(''); setNotice('');
    try {
      const product = await apiFetch<Product>('/products', token, { method: 'POST', body: JSON.stringify({
        name: form.name.trim(), sku: form.sku.trim(), category: form.category.trim() || undefined,
        unit: form.unit.trim() || undefined, price: Number(form.price),
        stockQuantity: Number(form.stock), shelfLifeDays: form.shelf ? Number(form.shelf) : undefined,
      }) });
      setItems(previous => [product, ...previous.filter(item => item._id !== product._id)]);
      setQuery(''); setForm(initial); setNotice('محصول ثبت شد.');
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'ثبت محصول انجام نشد.'); }
    finally { setSaving(false); }
  }

  const visible = items.filter(item => normalizeQuery([item.name, item.sku, item.category].join(' ')).includes(normalizeQuery(query)));
  return <div className="admin-section-stack">
    {ADMIN_ROLES.includes(user.role) && <details className="admin-panel admin-disclosure">
      <summary><span><AdminIcon name="products" />ثبت محصول جدید</span><AdminIcon name="plus" size={17} /></summary>
      <form className="admin-form-grid" onSubmit={create}>
        <label className="admin-field"><span>نام محصول</span><input className="admin-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
        <label className="admin-field"><span>شناسهٔ کالا (SKU)</span><input className="admin-input" dir="ltr" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required /></label>
        <label className="admin-field"><span>دسته‌بندی</span><input className="admin-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></label>
        <label className="admin-field"><span>واحد</span><input className="admin-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="مثلاً عدد یا بسته" /></label>
        <label className="admin-field"><span>قیمت (ریال)</span><input className="admin-input" type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></label>
        <label className="admin-field"><span>موجودی</span><input className="admin-input" type="number" min={0} step="any" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></label>
        <label className="admin-field"><span>ماندگاری (روز)</span><input className="admin-input" type="number" min={0} value={form.shelf} onChange={e => setForm({ ...form, shelf: e.target.value })} /></label>
        <div className="admin-form-footer"><button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'در حال ثبت…' : 'ثبت محصول'}</button></div>
        {saveError && <p role="alert" className="admin-alert admin-alert--error admin-form-wide">{saveError}</p>}
        {notice && <p role="status" className="admin-alert admin-form-wide">{notice}</p>}
      </form>
    </details>}
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h2>فهرست محصولات</h2>{!loading && !error && <p role="status">{faCount(visible.length)} محصول</p>}</div><AdminSearch value={query} onChange={setQuery} label="جست‌وجوی محصول" placeholder="نام یا شناسهٔ کالا" /></div>
      <CollectionState loading={loading} error={error} empty={!visible.length ? (query ? 'محصولی با این مشخصات پیدا نشد.' : 'هنوز محصولی ثبت نشده است.') : undefined} onRetry={refresh} />
      {visible.length > 0 && <AdminRecords items={visible} columns={columns} label="فهرست محصولات" />}
    </section>
  </div>;
}

export default function ProductsPage() {
  return <AppShell title="محصولات" eyebrow="عملیات" description="ثبت و مشاهدهٔ کالاها، قیمت و موجودی."><Products /></AppShell>;
}
