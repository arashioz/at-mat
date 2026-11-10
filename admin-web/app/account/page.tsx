'use client';

import { useState, type FormEvent } from 'react';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { AdminIcon } from '../../components/AdminIcon';
import { apiFetch, ROLE_LABELS } from '../../lib/api';

function Account() {
  const { user, token, logout } = useAdminWorkspace();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (repeat !== newPassword) { setError('رمز جدید و تکرار آن یکسان نیستند.'); return; }
    setPending(true);
    try {
      await apiFetch('/auth/change-password', token, { method: 'PATCH', body: JSON.stringify({ oldPassword, newPassword }) });
      setOldPassword(''); setNewPassword(''); setRepeat('');
      setNotice('رمز عبور تغییر کرد.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تغییر رمز انجام نشد.');
    } finally {
      setPending(false);
    }
  }

  return <div className="admin-section-stack admin-account">
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h2>مشخصات حساب</h2><p>حسابی که با آن وارد میز کار شده‌ای.</p></div><button className="admin-button admin-button--secondary" onClick={logout} type="button"><AdminIcon name="logout" size={17} />خروج</button></div>
      <dl className="admin-account-details"><div><dt>نام</dt><dd>{user.fullName}</dd></div><div><dt>نقش</dt><dd>{ROLE_LABELS[user.role]}</dd></div>{user.email && <div><dt>ایمیل</dt><dd><bdi>{user.email}</bdi></dd></div>}{user.phone && <div><dt>موبایل</dt><dd><bdi>{user.phone}</bdi></dd></div>}</dl>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-head"><div><h2>تغییر رمز عبور</h2><p>رمز فعلی و رمز جدید حساب را وارد کن.</p></div></div>
      <form className="admin-form-grid" onSubmit={updatePassword}>
        <label className="admin-field"><span>رمز فعلی</span><input className="admin-input" name="current-password" type="password" autoComplete="current-password" dir="ltr" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required /></label>
        <label className="admin-field"><span>رمز جدید</span><input className="admin-input" name="new-password" type="password" autoComplete="new-password" dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required /></label>
        <label className="admin-field"><span>تکرار رمز جدید</span><input className="admin-input" name="confirm-password" type="password" autoComplete="new-password" dir="ltr" value={repeat} onChange={e => setRepeat(e.target.value)} minLength={6} required /></label>
        {error && <p className="admin-form-wide admin-alert admin-alert--error" role="alert">{error}</p>}
        {notice && <p className="admin-form-wide admin-alert" role="status">{notice}</p>}
        <div className="admin-form-footer"><button className="admin-button admin-button--primary" type="submit" disabled={pending}>{pending ? 'در حال ذخیره…' : 'ذخیرهٔ رمز جدید'}</button></div>
      </form>
    </section>
  </div>;
}

export default function AccountPage() {
  return <AppShell title="حساب کاربری" description="مشخصات حساب و رمز عبور ورود به میز کار."><Account /></AppShell>;
}
