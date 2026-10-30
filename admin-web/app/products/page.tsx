'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { apiFetch, Product, TOKEN_KEY } from '../../lib/api';

const EMPTY_FORM = { name: '', sku: '', category: '', unit: 'piece', price: '0', stockQuantity: '0', shelfLifeDays: '' };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function ProductsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load(t: string) {
    try {
      setProducts(await apiFetch<Product[]>('/products', t));
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
      await apiFetch('/products', token, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          category: form.category || undefined,
          unit: form.unit,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          shelfLifeDays: form.shelfLifeDays ? Number(form.shelfLifeDays) : undefined,
        }),
      });
      setForm(EMPTY_FORM);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="محصولات (ERP)">
      <section className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 font-semibold">ثبت محصول جدید</h2>
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className={inputClass} placeholder="نام محصول" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className={inputClass} dir="ltr" placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          <input className={inputClass} placeholder="دسته" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className={inputClass} placeholder="واحد" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input className={inputClass} type="number" min="0" placeholder="قیمت (ریال)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className={inputClass} type="number" min="0" placeholder="موجودی" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
          <input className={inputClass} type="number" min="0" placeholder="ماندگاری (روز)" value={form.shelfLifeDays} onChange={(e) => setForm({ ...form, shelfLifeDays: e.target.value })} />
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-600 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60">
            {saving ? 'در حال ثبت...' : 'ثبت محصول'}
          </button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">نام</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">دسته</th>
              <th className="px-4 py-3 font-medium">قیمت</th>
              <th className="px-4 py-3 font-medium">موجودی</th>
              <th className="px-4 py-3 font-medium">ماندگاری</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3" dir="ltr">{p.sku}</td>
                <td className="px-4 py-3">{p.category ?? '-'}</td>
                <td className="px-4 py-3">{p.price.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-3">{p.stockQuantity} {p.unit}</td>
                <td className="px-4 py-3">{p.shelfLifeDays ? `${p.shelfLifeDays} روز` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {products.map((p) => (
          <div key={p._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{p.name}</span>
              <span className="text-xs text-slate-500" dir="ltr">{p.sku}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">قیمت: {p.price.toLocaleString('fa-IR')} ریال</p>
            <p className="mt-1 text-sm text-slate-600">موجودی: {p.stockQuantity} {p.unit}</p>
          </div>
        ))}
      </div>

      {products.length === 0 && <p className="py-10 text-center text-sm text-slate-500">هنوز محصولی ثبت نشده است.</p>}
    </AppShell>
  );
}
