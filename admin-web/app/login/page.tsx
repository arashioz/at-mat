'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BrandEdge } from '../../../web/src/features/brine/brand-edge';
import { AdminIcon } from '../../components/AdminIcon';
import { BrandLogo, useBrand } from '../../components/Brand';
import { ApiError, fetchMe, login, TOKEN_KEY } from '../../lib/api';
import { SITE_URL } from '../../lib/media';

export default function LoginPage() {
  const router = useRouter();
  const { cover } = useBrand();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    let active = true;
    setChecking(true);
    fetchMe(token).then(() => {
      if (active) router.replace('/dashboard');
    }).catch(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(identifier.trim(), password);
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'ارتباط با پنل برقرار نشد. دوباره تلاش کنید.');
      setLoading(false);
    }
  }

  return (
    <div className="admin-login">
      <aside className="admin-login-hero" aria-label="ات‌مت">
        {cover && <img className="admin-login-photo" src={cover} alt="" fetchPriority="high" />}
        <div className="admin-login-brand-copy">
          <a className="admin-login-logo" href={SITE_URL} aria-label="صفحهٔ اصلی ات‌مت"><BrandLogo decorative /></a>
          <div>
            <p className="admin-kicker"><span /> استودیوی ات‌مت</p>
            <p className="admin-login-headline">از آشپزخانه<br /><em>تا مجله.</em></p>
            <p className="admin-login-tagline">میز کار تیم ات‌مت برای مدیریت محتوا و عملیات.</p>
          </div>
        </div>
        <BrandEdge id="atmat-login-edge" className="admin-login-edge" fillBelow />
      </aside>

      <main className="admin-login-entry">
        <div className="admin-login-inner">
          <p className="admin-login-kicker"><span><AdminIcon name="lock" size={19} /></span> پنل مدیریت ات‌مت</p>
          <h1>ورود به میز کار</h1>
          <p className="admin-description">با حساب کاربری ات‌مت وارد شوید.</p>

          <form className="admin-login-form" method="post" onSubmit={submit} aria-busy={checking || loading}>
            <label className="admin-field">
              <span>ایمیل یا شماره موبایل</span>
              <input className="admin-input" name="username" type="text" dir="ltr" autoComplete="username" value={identifier} onChange={e => setIdentifier(e.target.value)} placeholder="name@example.com" required disabled={checking || loading} />
            </label>
            <div className="admin-field">
              <label htmlFor="admin-password">رمز عبور</label>
              <div className="at-search-control admin-password">
                <input id="admin-password" name="password" type={visible ? 'text' : 'password'} dir="ltr" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={checking || loading} />
                <button className="admin-icon-button" type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'} aria-controls="admin-password" title={visible ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'}><AdminIcon name={visible ? 'eye-off' : 'eye'} /></button>
              </div>
            </div>
            {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
            <button className="admin-button admin-button--primary admin-login-submit" type="submit" disabled={checking || loading}>
              {checking ? 'در حال بررسی حساب…' : loading ? 'در حال ورود…' : 'ورود به پنل'} <AdminIcon name="arrow" />
            </button>
          </form>

          <a className="admin-login-site" href={SITE_URL}><AdminIcon name="external" size={16} /> بازگشت به سایت ات‌مت</a>
        </div>
      </main>
    </div>
  );
}
