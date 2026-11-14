'use client';

import { useState, type FormEvent } from 'react';
import { normalizePhone, toAsciiDigits } from '../../../backend/src/common/utils/phone.util';
import { AdminIcon } from '../../components/AdminIcon';
import { AdminSearch, CollectionState, faCount, normalizeQuery } from '../../components/AdminForms';
import { AdminRecords, type AdminRecordColumn } from '../../components/AdminRecords';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { apiFetch, type Customer } from '../../lib/api';
import { CUSTOMER_EDITORS } from '../../lib/navigation';
import { useCollection } from '../../lib/use-collection';

const TYPES: Record<string, string> = { store: 'فروشگاه', supermarket: 'سوپرمارکت', wholesaler: 'عمده‌فروش', restaurant: 'رستوران', other: 'سایر' };
const initial = { name: '', type: 'store', phone: '', city: '', address: '' };
const columns: AdminRecordColumn<Customer>[] = [
  { label: 'نوع', value: item => TYPES[item.type] ?? item.type },
  { label: 'موبایل', value: item => <bdi>{item.phone}</bdi> },
  { label: 'شهر', value: item => item.city || '—' },
  {
    label: 'وضعیت',
    value: item => <span className={`admin-chip ${item.isActive ? 'admin-chip--live' : ''}`}>{item.isActive ? 'فعال' : 'غیرفعال'}</span>,
  },
];

function Customers() {
  const { token, user } = useAdminWorkspace();
  const { items, setItems, loading, error, refresh } = useCollection<Customer>('/customers', token);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const edit = CUSTOMER_EDITORS.includes(user.role);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setNotice(''); setSaveError('');
    try {
      const customer = await apiFetch<Customer>('/customers', token, { method: 'POST', body: JSON.stringify({
        ...form, name: form.name.trim(), phone: normalizePhone(form.phone),
        city: form.city.trim() || undefined, address: form.address.trim() || undefined,
      }) });
      setItems(previous => [customer, ...previous.filter(item => item._id !== customer._id)]);
      setForm(initial); setQuery('');
      setNotice('مشتری ثبت شد.');
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'ثبت مشتری انجام نشد.'); }
    finally { setSaving(false); }
  }

  const search = normalizeQuery(toAsciiDigits(query));
  const visible = items.filter(item => normalizeQuery([item.name, TYPES[item.type], item.phone, item.city].join(' ')).includes(search));
  return <div className="admin-section-stack">
    {edit && <details className="admin-panel admin-disclosure">
      <summary><span><AdminIcon name="customers" />ثبت مشتری جدید</span><AdminIcon name="plus" size={17} /></summary>
      <form className="admin-form-grid" onSubmit={create}>
        <label className="admin-field"><span>نام مشتری</span><input className="admin-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></label>
        <label className="admin-field"><span>نوع مشتری</span><select className="admin-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="admin-field"><span>شماره موبایل</span><input className="admin-input" type="tel" dir="ltr" placeholder="09120000000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></label>
        <label className="admin-field"><span>شهر</span><input className="admin-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></label>
        <label className="admin-field admin-form-wide"><span>آدرس</span><textarea className="admin-input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></label>
        <div className="admin-form-footer"><button className="admin-button admin-button--primary" type="submit" disabled={saving}>{saving ? 'در حال ثبت…' : 'ثبت مشتری'}</button></div>
        {saveError && <p role="alert" className="admin-alert admin-alert--error admin-form-wide">{saveError}</p>}
        {notice && <p role="status" className="admin-alert admin-form-wide">{notice}</p>}
      </form>
    </details>}
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h2>فهرست مشتریان</h2>{!loading && !error && <p role="status">{faCount(visible.length)} مشتری</p>}</div><AdminSearch value={query} onChange={setQuery} label="جست‌وجوی مشتری" placeholder="نام، شماره یا شهر" /></div>
      <CollectionState loading={loading} error={error} empty={!visible.length ? (query ? 'مشتری با این مشخصات پیدا نشد.' : 'هنوز مشتری ثبت نشده است.') : undefined} onRetry={refresh} />
      {visible.length > 0 && <AdminRecords items={visible} columns={columns} label="فهرست مشتریان" />}
    </section>
  </div>;
}

export default function CustomersPage() {
  return <AppShell title="مشتریان" eyebrow="عملیات" description="ثبت و مشاهدهٔ اطلاعات مشتریان ات‌مت."><Customers /></AppShell>;
}
