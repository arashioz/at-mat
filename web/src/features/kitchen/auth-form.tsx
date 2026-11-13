'use client';
import { useState, type FormEvent } from 'react';
import { kitchenApi, errorText } from './api';
import type { Member } from './types';

export function AuthForm({ onSuccess }: { onSuccess: (member: Member) => void }) {
  const [register, setRegister] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError('');
    try {
      const result = await kitchenApi<{ user: Member }>(register ? 'register' : 'login', 'POST', {
        ...(register && { name: form.get('name') }), email: form.get('email'), password: form.get('password'),
      });
      onSuccess(result.user);
    } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }
  return <div className="k-auth">
    <p className="k-eyebrow">آشپزخانهٔ شخصی تو</p><h2>{register ? 'مزه‌های خوب را نگه دار.' : 'خوش برگشتی.'}</h2>
    <p>رسپی‌های ذخیره‌شده و گفتگوهایت، هر بار که وارد شوی در دسترس‌اند.</p>
    <div className="k-auth__tabs"><button type="button" aria-pressed={register} onClick={() => { setRegister(true); setError(''); }}>ساخت حساب</button><button type="button" aria-pressed={!register} onClick={() => { setRegister(false); setError(''); }}>ورود</button></div>
    <form method="post" onSubmit={submit}>
      {register && <label>نام تو<input className="at-control" name="name" autoComplete="name" required minLength={2} maxLength={60} /></label>}
      <label>ایمیل<input className="at-control" type="email" name="email" autoComplete="email" dir="ltr" required maxLength={254} /></label>
      <label>رمز عبور<input className="at-control" type="password" name="password" autoComplete={register ? 'new-password' : 'current-password'} dir="ltr" required minLength={10} maxLength={72} aria-describedby={register ? 'k-password-hint' : undefined} /></label>
      {register && <small id="k-password-hint">حداقل ۱۰ کاراکتر؛ یک رمز منحصربه‌فرد انتخاب کن.</small>}
      {error && <p className="k-error" role="alert">{error}</p>}
      <button className="k-button" disabled={busy}>{busy ? 'چند لحظه…' : register ? 'ساخت حساب و ادامه' : 'ورود به آشپزخانه'}</button>
    </form>
  </div>;
}
