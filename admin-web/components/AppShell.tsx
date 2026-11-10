'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ApiError, fetchMe, fetchMyFeatures, ROLE_LABELS, TOKEN_KEY, type AuthUser } from '../lib/api';
import { SITE_URL } from '../lib/media';
import { canOpen, isActivePath, NAV_ITEMS } from '../lib/navigation';
import { AdminIcon } from './AdminIcon';
import { BrandLogo } from './Brand';

type Session = { token: string; user: AuthUser; features: Record<string, boolean> };
const SessionContext = createContext<(Session & { logout: () => void }) | null>(null);

export function useAdminWorkspace() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('Admin content must be rendered inside AppShell.');
  return context;
}

const sections = [
  ['workspace', 'میز کار'], ['content', 'مدیریت محتوا'], ['operations', 'عملیات'], ['account', 'حساب'],
] as const;

export function AppShell({ title, description, eyebrow, actions, children }: {
  title: string; description?: string; eyebrow?: string; actions?: ReactNode; children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mobileMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let current = true;
    let sequence = 0;
    function signIn() {
      if (!current) return;
      sequence++;
      setSession(null);
      router.replace('/login');
    }
    async function verify() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { signIn(); return; }
      const check = ++sequence;
      setError(false);
      try {
        const [user, features] = await Promise.all([fetchMe(token), fetchMyFeatures(token)]);
        if (current && sequence === check) setSession({ token, user, features });
      } catch (err) {
        if (!current || sequence !== check) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          localStorage.removeItem(TOKEN_KEY);
          signIn();
        } else {
          setSession(null);
          setError(true);
        }
      }
    }
    function storageChanged(event: StorageEvent) {
      if (event.key === TOKEN_KEY || event.key === null) { setSession(null); void verify(); }
    }
    window.addEventListener('storage', storageChanged);
    window.addEventListener('atmat:session-expired', signIn);
    void verify();
    return () => {
      current = false;
      window.removeEventListener('storage', storageChanged);
      window.removeEventListener('atmat:session-expired', signIn);
    };
  }, [router, attempt]);

  useEffect(() => {
    if (mobileMenu.current) mobileMenu.current.open = false;
    function dismiss(event: PointerEvent) {
      const menu = mobileMenu.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    }
    function escape(event: KeyboardEvent) {
      const menu = mobileMenu.current;
      if (menu?.open && event.key === 'Escape') {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [pathname]);

  function logout() {
    if (!window.dispatchEvent(new Event('atmat:before-leave', { cancelable: true }))) return;
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('atmat:session-expired'));
  }

  if (!session) return (
    <main className="admin-loading" aria-busy={!error}>
      <BrandLogo />
      {error ? <><p role="alert">ارتباط با پنل برقرار نشد.</p><button className="admin-button admin-button--primary" type="button" onClick={() => setAttempt(n => n + 1)}>تلاش دوباره</button></> : <p role="status">در حال باز کردن میز کار…</p>}
    </main>
  );

  const { user, features } = session;
  const items = NAV_ITEMS.filter(item => canOpen(item, user.role, features));
  const activeItem = NAV_ITEMS.find(item => isActivePath(pathname, item.href));
  const allowed = !activeItem || canOpen(activeItem, user.role, features);
  const quickLinks = items.filter(item => item.href !== '/dashboard' && item.group !== 'account').slice(0, 2);
  const group = sections.find(([id]) => id === activeItem?.group)?.[1];

  const navLinks = (section: (typeof sections)[number][0]) => items.filter(item => item.group === section).map(item => (
    <Link key={item.href} className="admin-nav-link" href={item.href} aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}>
      <AdminIcon name={item.icon} /><span>{item.label}</span><span className="admin-nav-indicator" aria-hidden="true" />
    </Link>
  ));

  return (
    <SessionContext.Provider value={{ ...session, logout }}>
      <a className="admin-skip" href="#admin-main">رفتن به محتوای اصلی</a>
      <div className="admin-shell">
        <aside className="admin-rail">
          <Link className="admin-rail-brand" href="/dashboard" aria-label="پیشخوان ات‌مت">
            <BrandLogo decorative /><span>میز کار ات‌مت</span>
          </Link>
          <nav className="admin-nav" aria-label="منوی مدیریت">
            {sections.map(([id, label]) => {
              const links = navLinks(id);
              return links.length ? <div className="admin-nav-group" key={id}><p>{label}</p>{links}</div> : null;
            })}
          </nav>
          <div className="admin-rail-footer">
            <a href={SITE_URL} target="_blank" rel="noreferrer" className="admin-nav-link"><AdminIcon name="external" /><span>مشاهدهٔ سایت</span></a>
            <div className="admin-rail-profile"><span className="admin-avatar" aria-hidden="true">{user.fullName.trim()[0] || 'ا'}</span><div><strong><bdi>{user.fullName}</bdi></strong><small>{ROLE_LABELS[user.role]}</small></div><button className="admin-icon-button" type="button" onClick={logout} aria-label="خروج از پنل" title="خروج از پنل"><AdminIcon name="logout" size={18} /></button></div>
          </div>
        </aside>

        <div className="admin-workspace">
          <header className="admin-topbar">
            <Link className="admin-topbar-brand" href="/dashboard" aria-label="پیشخوان ات‌مت"><BrandLogo decorative /></Link>
            <p className="admin-breadcrumb"><Link href="/dashboard">میز کار ات‌مت</Link>{group && group !== 'میز کار' && <><span aria-hidden="true">/</span><span>{group}</span></>}</p>
            <Link className="admin-topbar-account" href="/account" aria-label="حساب کاربری"><bdi>{user.fullName}</bdi></Link>
          </header>
          <main className="admin-main" id="admin-main" tabIndex={-1}>
            <div className="admin-page-head">
              <div>{eyebrow && <p className="admin-kicker">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="admin-description">{description}</p>}</div>
              {allowed && actions && <div className="admin-actions">{actions}</div>}
            </div>
            {allowed ? children : <div className="admin-panel admin-empty"><h2>این بخش برای حساب شما در دسترس نیست.</h2><Link className="admin-button admin-button--secondary" href="/dashboard">بازگشت به پیشخوان</Link></div>}
          </main>
        </div>

        <nav className="admin-mobile-nav" aria-label="دسترسی سریع مدیریت">
          {quickLinks.map(item => <Link key={item.href} className="admin-mobile-link" href={item.href} aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}><AdminIcon name={item.icon} /><span>{item.short ?? item.label}</span></Link>)}
          <details ref={mobileMenu} className="admin-mobile-menu">
            <summary className="admin-mobile-link"><AdminIcon name="menu" /><span>همهٔ بخش‌ها</span></summary>
            <div className="admin-mobile-panel">
              <p className="admin-mobile-title">میز کار ات‌مت</p>
              {sections.map(([id, label]) => {
                const links = navLinks(id);
                return links.length ? <div className="admin-nav-group" key={id}><p>{label}</p>{links}</div> : null;
              })}
              <div className="admin-mobile-exits"><a className="admin-nav-link" href={SITE_URL} target="_blank" rel="noreferrer"><AdminIcon name="external" />مشاهدهٔ سایت</a><button className="admin-nav-link" type="button" onClick={logout}><AdminIcon name="logout" />خروج</button></div>
            </div>
          </details>
        </nav>
      </div>
    </SessionContext.Provider>
  );
}
