'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { kitchenApi, errorText } from './api';
import { AuthForm } from './auth-form';
import { PersonalRecipe } from './personal-recipe';
import { KitchenIcon } from './kitchen-icons';
import type { ConversationSummary, Member, SavedRecipe, Session } from './types';
import './kitchen.css';

export function KitchenAccount({ logo }: { logo: string }) {
  const [member, setMember] = useState<Member | null>(null);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState('');
  async function load(user?: Member) {
    setError('');
    try {
      const current = user ?? (await kitchenApi<Session>('session')).user;
      setMember(current);
      if (current && !current.guest) {
        const [recipes, conversations] = await Promise.all([kitchenApi<SavedRecipe[]>('saved'), kitchenApi<ConversationSummary[]>('conversations')]);
        setSaved(recipes); setHistory(conversations);
      }
    } catch (err) { setError(errorText(err)); } finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function logout() {
    try { await kitchenApi('logout', 'POST', {}); setMember(null); setSaved([]); setHistory([]); } catch (err) { setError(errorText(err)); }
  }
  async function remove(id: string) {
    setRemoving(id);
    try { await kitchenApi(`saved/${id}`, 'DELETE'); setSaved(old => old.filter(r => r.id !== id)); } catch (err) { setError(errorText(err)); } finally { setRemoving(''); }
  }
  return <div className="k-account"><header className="k-header"><Link href="/" className="k-logo"><img src={logo} alt="ات‌مت، خانه" width={84} height={54} /></Link><strong>آشپزخانهٔ من</strong><Link href="/kitchen" className="k-button">گفتگو با همراه آشپزی</Link></header><main id="main-content" tabIndex={-1} className="k-account__main">
    {loading ? <p className="k-status" role="status">در حال بازکردن آشپزخانهٔ تو…</p> : !member || member.guest ? <div className="k-account__entry"><div className="k-account__invitation"><span className="k-mark k-mark--large"><KitchenIcon name="book" /></span><h1>دفتر مزه‌های<br />خودت را بساز.</h1><p>رسپی‌های دلخواهت، فهرست مواد و گفتگوهای قبلی؛ همه کنار هم، برای وقتی که دوباره هوسشان کردی.</p><Link className="k-button k-button--soft" href="/kitchen">اول یک غذا انتخاب کنیم</Link></div><AuthForm onSuccess={user => { void load(user); }} /></div> : <>
      <div className="k-account__heading"><div><p className="k-eyebrow">خوش آمدی، {member.name}</p><h1>مزه‌های خودت.</h1><p>رسپی‌هایی که برای خودت نگه داشته‌ای، همین‌جایند.</p></div><button className="k-button k-button--soft" onClick={() => { void logout(); }}>خروج از حساب</button></div>
      <div className="k-account__layout"><section aria-labelledby="saved-title"><h2 id="saved-title">رسپی‌های من <span className="k-badge">{saved.length.toLocaleString('fa-IR')}</span></h2>{saved.length ? <div className="k-saved-list">{saved.map(item => <div className="k-saved" key={item.id}><PersonalRecipe recipe={item.recipe} /><div className="k-saved__actions"><Link className="k-button k-button--soft" href={`/kitchen/chat/${item.conversationId}`}>ادامهٔ گفتگوی این رسپی</Link><button className="k-remove" disabled={removing === item.id} onClick={() => { void remove(item.id); }}>{removing === item.id ? 'در حال حذف…' : 'حذف از ذخیره‌ها'}</button></div></div>)}</div> : <div className="k-empty"><KitchenIcon name="book" /><h3>اولین رسپی‌ات را پیدا کنیم.</h3><p>در گفتگو، دکمهٔ «ذخیره در آشپزخانهٔ من» را بزن تا رسپی اینجا بماند.</p><Link className="k-button" href="/kitchen">شروع یک گفتگوی خوشمزه</Link></div>}</section><aside className="k-account__history"><h2>گفتگوهای تو</h2><nav className="k-history">{history.map(item => <Link key={item.id} href={`/kitchen/chat/${item.id}`}>{item.title}<small>{new Date(item.updatedAt).toLocaleDateString('fa-IR')}</small></Link>)}</nav>{!history.length && <p className="k-small">هنوز گفتگویی شروع نکرده‌ای.</p>}</aside></div>
    </>}{error && <p className="k-error" role="alert">{error} <button className="k-button" onClick={() => { void load(); }}>تلاش دوباره</button></p>}
  </main></div>;
}
