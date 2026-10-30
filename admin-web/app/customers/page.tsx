'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { apiFetch, Customer, TOKEN_KEY } from '../../lib/api';

const TYPE_LABELS: Record<string, string> = {
  store: 'فروشگاه',
  supermarket: 'سوپرمارکت',
  wholesaler: 'عمده‌فروش',
  restaurant: 'رستوران',
  other: 'سایر',
};

const EMPTY_FORM = { name: '', type: 'store', phone: '', city: '', address: '' };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function CustomersPage() {
  const [token, setToken] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load(t: string) {
    try {
      setCustomers(await apiFetch<Customer[]>('/customers', t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    }
  }

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    setToken(t);
    load(t);
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      await apiFetch('/customers', token, { method: 'POST', body: JSON.stringify(form) });
      setForm(EMPTY_FORM);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="مشتریان (CRM)">
      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-semibold">ثبت مشتری جدید</h2>
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input className={inputClass} placeholder="نام مشتری" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <input className={inputClass} dir="ltr" placeholder="09120000000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input className={inputClass} placeholder="شهر" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className={`${inputClass} sm:col-span-2 lg:col-span-1`} placeholder="آدرس" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60 sm:col-span-2 lg:col-span-3">
            {saving ? 'در حال ثبت...' : 'ثبت مشتری'}
          </button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      {/* نمای جدول برای دسکتاپ */}
      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">نام</th>
              <th className="px-4 py-3 font-medium">نوع</th>
              <th className="px-4 py-3 font-medium">موبایل</th>
              <th className="px-4 py-3 font-medium">شهر</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{TYPE_LABELS[c.type] ?? c.type}</td>
                <td className="px-4 py-3" dir="ltr">{c.phone}</td>
                <td className="px-4 py-3">{c.city ?? '-'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                    {c.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* نمای کارتی برای موبایل */}
      <div className="grid gap-3 md:hidden">
        {customers.map((c) => (
          <div key={c._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{c.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                {c.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-500">{TYPE_LABELS[c.type] ?? c.type} · {c.city ?? '-'}</p>
            <p className="mt-1 text-sm" dir="ltr">{c.phone}</p>
          </div>
        ))}
      </div>

      {customers.length === 0 && <p className="py-10 text-center text-sm text-slate-500">هنوز مشتری ثبت نشده است.</p>}
    </AppShell>
  );
}
