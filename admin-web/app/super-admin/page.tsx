'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { FeatureFlag, fetchAllFeatures, setFeatureEnabled, TOKEN_KEY } from '../../lib/api';

export default function SuperAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function load(t: string) {
    try {
      setFeatures(await fetchAllFeatures(t));
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

  async function toggle(feature: FeatureFlag) {
    if (!token) return;
    setError(null);
    setPendingKey(feature.key);
    try {
      await setFeatureEnabled(token, feature.key, !feature.enabled);
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setPendingKey(null);
    }
  }

  const groups = features.reduce<Record<string, FeatureFlag[]>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  return (
    <AppShell title="مدیریت فیچرها (سوپر ادمین)">
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {Object.entries(groups).map(([group, items]) => (
        <section key={group} className="mb-6">
          <h2 className="mb-3 font-semibold text-slate-700">{group}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((f) => (
              <div key={f.key} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                <div>
                  <p className="font-semibold">{f.label}</p>
                  <p className="mt-1 text-xs text-slate-500" dir="ltr">{f.key}</p>
                  {f.description && <p className="mt-1 text-xs text-slate-500">{f.description}</p>}
                </div>
                <button
                  onClick={() => toggle(f)}
                  disabled={pendingKey === f.key}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                    f.enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {f.enabled ? 'روشن' : 'خاموش'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {features.length === 0 && !error && (
        <p className="py-10 text-center text-sm text-slate-500">هنوز فیچری ثبت نشده است.</p>
      )}
    </AppShell>
  );
}
