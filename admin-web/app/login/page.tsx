'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, TOKEN_KEY } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken } = await login(identifier.trim(), password);
      localStorage.setItem(TOKEN_KEY, accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-bold text-brand-700">At-Mat</div>
          <p className="mt-1 text-sm text-slate-500">ورود به پنل مدیریت</p>
        </div>

        <label className="mb-4 block text-sm font-medium text-slate-700">
          ایمیل یا شماره موبایل
          <input type="text" dir="ltr" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="admin@example.com" required className={inputClass} />
        </label>

        <label className="mb-5 block text-sm font-medium text-slate-700">
          رمز عبور
          <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
        </label>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </main>
  );
}
