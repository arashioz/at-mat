'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthUser, fetchMe, ROLE_LABELS, TOKEN_KEY } from '../lib/api';

const NAV_ITEMS = [
  { href: '/articles', label: 'مقالات', icon: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5' },
  { href: '/dashboard', label: 'داشبورد', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { href: '/customers', label: 'مشتریان', icon: 'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0' },
  { href: '/products', label: 'محصولات', icon: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7' },
];

function NavIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchMe(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        router.replace('/login');
      });
  }, [router]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    router.replace('/login');
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="min-h-screen md:flex">
      {/* سایدبار دسکتاپ */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-slate-200 bg-white md:flex">
        <div className="px-6 py-5 text-lg font-bold text-brand-700">At-Mat</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.filter(item => item.href !== '/articles' || ['admin', 'super_admin'].includes(user.role)).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <NavIcon d={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-4 text-sm">
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          <button onClick={logout} className="mt-3 w-full rounded-lg border border-slate-300 py-2 text-slate-600 hover:bg-slate-50">
            خروج
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
          <h1 className="text-lg font-bold">{title}</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">{user.fullName}</span>
            <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 md:hidden">
              خروج
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-8 md:pb-8">{children}</main>
      </div>

      {/* تب‌بار پایین موبایل */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV_ITEMS.filter(item => item.href !== '/articles' || ['admin', 'super_admin'].includes(user.role)).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${active ? 'text-brand-600' : 'text-slate-500'}`}
            >
              <NavIcon d={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
