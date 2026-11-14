'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { KitchenIcon } from './kitchen-icons';
import { draftKey, errorText } from './api';
import './kitchen.css';

export const starters = ['با تن و سیب‌زمینی برای دو نفر چی بپزم؟', 'یک شام سریع بدون لبنیات می‌خوام', 'برای سالاد تن، چی بخرم؟'];
export function RecipeLauncher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  function start(text: string) {
    if (starting || text.trim().length < 2) return;
    try {
      const id = crypto.randomUUID();
      sessionStorage.setItem(draftKey(id), JSON.stringify({ requestId: crypto.randomUUID(), text: text.trim() }));
      setStarting(true);
      router.push(`/kitchen/chat/${id}`);
    } catch (err) { setError(errorText(err)); }
  }
  function submit(event: FormEvent) { event.preventDefault(); start(prompt); }
  return <div className={`k-launcher ${compact ? 'k-launcher--compact' : ''}`}>
    {!compact && <div className="k-launcher__intro"><span className="k-mark"><KitchenIcon /></span><div><h3>همراه آشپزی ات‌مت</h3><p>بگو چی داری، چند نفرید و چه غذایی دوست داری.</p></div><span className="k-badge">نسخهٔ اولیه</span></div>}
    <form onSubmit={submit} className="k-prompt">
      <label htmlFor="kitchen-prompt" className="sr-only">درخواستت از همراه آشپزی</label>
      <textarea id="kitchen-prompt" value={prompt} maxLength={2000} rows={2} onChange={e => setPrompt(e.target.value)} placeholder="مثلاً: تن و سیب‌زمینی دارم؛ یه شام برای دو نفر، بدون فر…" required minLength={2} />
      <div className="k-prompt__foot"><span>از ایدهٔ غذا تا پخت و خرید</span><button className="k-button" disabled={starting || prompt.trim().length < 2}>{starting ? 'در حال ورود…' : 'شروع گفتگو'}</button></div>
    </form>
    {error && <p role="alert" className="k-error">{error}</p>}
    <div className="k-starters" aria-label="ایده برای شروع گفتگو">{starters.map(text => <button type="button" key={text} disabled={starting} onClick={() => start(text)}>{text}</button>)}</div>
    {!compact && <p className="k-launcher__note">گفتگو را همین‌جا شروع کن؛ رسپی‌های دلخواهت را در <a href="/account">آشپزخانهٔ من</a> نگه دار.</p>}
  </div>;
}
