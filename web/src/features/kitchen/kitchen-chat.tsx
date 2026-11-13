'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { kitchenApi, ensureSession, draftKey, errorText } from './api';
import type { Conversation, ConversationSummary, KitchenMessage, Member, SavedRecipe, Session } from './types';
import { KitchenIcon } from './kitchen-icons';
import { RecipeLauncher } from './recipe-launcher';
import { PersonalRecipe } from './personal-recipe';
import { AuthForm } from './auth-form';
import './kitchen.css';

type Draft = { text: string; requestId: string };

export function KitchenChat({ logo, id }: { logo: string; id?: string }) {
  const [user, setUser] = useState<Member | null>(null);
  const [mode, setMode] = useState('catalog');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [history, setHistory] = useState<ConversationSummary[]>([]);
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Draft | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [saving, setSaving] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const sending = useRef(false);
  const scrollArea = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const pendingSave = useRef<KitchenMessage | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);

  async function refreshLibrary() {
    const [conversations, recipes] = await Promise.all([kitchenApi<ConversationSummary[]>('conversations'), kitchenApi<SavedRecipe[]>('saved')]);
    setHistory(conversations); setSaved(recipes);
  }
  async function send(payload: Draft) {
    if (!id || sending.current) return;
    sending.current = true; setBusy(true); setPending(payload); setError('');
    try {
      sessionStorage.setItem(draftKey(id), JSON.stringify(payload));
      const result = await kitchenApi<Conversation>(`conversations/${id}/messages`, 'POST', payload);
      setConversation(result); setPending(null); sessionStorage.removeItem(draftKey(id));
      void refreshLibrary().catch(() => {});
    } catch (err) { setError(errorText(err)); }
    finally { sending.current = false; setBusy(false); }
  }
  useEffect(() => {
    let disposed = false;
    setConversation(null); setPending(null); setLoading(true); setError('');
    async function boot() {
      try {
        const stored = id ? sessionStorage.getItem(draftKey(id)) : null;
        const payload = stored ? JSON.parse(stored) as Draft : null;
        const session = payload ? await ensureSession() : await kitchenApi<Session>('session');
        if (disposed) return;
        setUser(session.user); setMode(session.mode);
        if (session.user) void refreshLibrary().catch(() => {});
        if (id) {
          if (!session.user) {
            setError('برای باز کردن گفتگوی قبلی وارد حسابت شو، یا یک گفتگوی تازه شروع کن.');
            return;
          }
          const result = await kitchenApi<Conversation>(`conversations/${id}`, payload ? 'PUT' : 'GET', payload ? {} : undefined);
          if (disposed) return;
          setConversation(result);
          if (payload) {
            if (result.messages.some(m => m.requestId === payload.requestId)) sessionStorage.removeItem(draftKey(id));
            else void send(payload);
          }
        }
      } catch (err) { if (!disposed) setError(errorText(err)); }
      finally { if (!disposed) setLoading(false); }
    }
    void boot();
    return () => { disposed = true; };
    // The route key owns the conversation lifetime. Drafts have stable retry IDs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const replies = area.querySelectorAll<HTMLElement>('.k-message--assistant');
    const latest = replies[replies.length - 1];
    const top = !pending && latest ? area.scrollTop + latest.getBoundingClientRect().top - area.getBoundingClientRect().top - 16 : area.scrollHeight;
    area.scrollTo({ top, behavior: 'instant' });
  }, [conversation?.messages.length, pending, busy]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); menuButton.current?.focus(); } };
    const desktop = window.matchMedia('(min-width: 851px)');
    const resize = () => { if (desktop.matches) setMenu(false); };
    window.addEventListener('keydown', close); desktop.addEventListener('change', resize);
    return () => { window.removeEventListener('keydown', close); desktop.removeEventListener('change', resize); };
  }, []);
  useEffect(() => { if (menu) menuClose.current?.focus(); }, [menu]);
  function closeMenu() { setMenu(false); menuButton.current?.focus(); }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy || pending) return;
    const text = draft.trim(); setDraft(''); void send({ text, requestId: crypto.randomUUID() });
  }
  async function saveMessage(message: KitchenMessage, member = user) {
    if (!member || member.guest) { pendingSave.current = message; dialog.current?.showModal(); return; }
    if (!id) return;
    setSaving(message.id); setSaveNotice('');
    try {
      const item = await kitchenApi<SavedRecipe>('saved', 'POST', { conversationId: id, messageId: message.id });
      setSaved(old => [...old.filter(s => s.id !== item.id), item]); setSaveNotice('رسپی در آشپزخانهٔ تو ذخیره شد.');
    } catch (err) { setSaveNotice(errorText(err)); } finally { setSaving(''); }
  }
  async function signedIn(member: Member) {
    setUser(member); dialog.current?.close();
    await refreshLibrary().catch(() => {});
    if (pendingSave.current) { void saveMessage(pendingSave.current, member); pendingSave.current = null; }
  }
  const lastReply = [...(conversation?.messages ?? [])].reverse().find(m => m.reply)?.reply;
  return <div className="k-app">
    <header className="k-header"><Link className="k-logo" href="/" aria-label="ات‌مت، خانه"><img src={logo} width={84} height={54} alt="ات‌مت" /></Link><div className="k-header__title"><strong>همراه آشپزی</strong><span>{mode === 'model' ? 'از مواد تو، تا غذای تو' : 'نسخهٔ پایه · بر اساس رسپی‌های ات‌مت'}</span></div><Link className="k-button k-button--soft k-header__account" href="/account" aria-label="آشپزخانهٔ من"><KitchenIcon name="book" /><span>آشپزخانهٔ من</span></Link><button ref={menuButton} className="k-icon-button k-mobile-menu" onClick={() => setMenu(!menu)} aria-label="سابقهٔ گفتگوها" aria-expanded={menu}><KitchenIcon name="chat" /></button></header>
    {menu && <button className="k-backdrop" aria-label="بستن فهرست" tabIndex={-1} onClick={closeMenu} />}
    <aside className={`k-sidebar ${menu ? 'is-open' : ''}`} aria-label="گفتگوهای من">
      <button ref={menuClose} className="k-icon-button k-sidebar__close" aria-label="بستن سابقهٔ گفتگوها" onClick={closeMenu}><KitchenIcon name="close" /></button>
      <Link href="/kitchen" className="k-button" onClick={() => setMenu(false)}><KitchenIcon name="plus" />گفتگوی تازه</Link>
      <p className="k-eyebrow">روی میز آشپزخانه</p><nav><Link className="k-sidebar__link" href="/account"><KitchenIcon name="book" />رسپی‌های من <span>{saved.length.toLocaleString('fa-IR')}</span></Link><Link className="k-sidebar__link" href="/recipes"><KitchenIcon name="chef" />همهٔ رسپی‌ها</Link></nav>
      <p className="k-eyebrow">گفتگوهای اخیر</p><nav className="k-history">{history.map(item => <Link href={`/kitchen/chat/${item.id}`} key={item.id} onClick={() => setMenu(false)} aria-current={item.id === id ? 'page' : undefined}>{item.title}<small>{new Date(item.updatedAt).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })}</small></Link>)}{!loading && !history.length && <p className="k-small">اولین ایدهٔ خوشمزه، از همین‌جا شروع می‌شود.</p>}</nav>
      <div className="k-sidebar__member"><KitchenIcon name="user" /><span>{user?.guest ? 'فعلاً مهمان آشپزخانه‌ای' : user?.name ?? 'آشپزخانهٔ ات‌مت'}</span>{user?.guest && <Link href="/account">ورود / عضویت</Link>}</div>
    </aside>
    <main id="main-content" className="k-chat" tabIndex={-1} inert={menu}>
      <div className="k-chat__scroll" ref={scrollArea}>
        {!id ? <div className="k-welcome"><span className="k-mark k-mark--large"><KitchenIcon /></span><p className="k-eyebrow">کنار تو، توی آشپزخانه</p><h1>امروز چی بپزیم؟</h1><p>از مواد دم دستت بگو.<br />با هم انتخاب می‌کنیم، آماده می‌کنیم و می‌پزیم.</p><RecipeLauncher compact /></div> : <div className="k-thread"><h1 className="k-thread__title">{conversation?.title ?? 'یک ایدهٔ تازه برای امروز'}</h1>
          {loading && <p className="k-status" role="status">در حال بازکردن آشپزخانه…</p>}
          {conversation?.messages.map(message => <article key={message.id} className={`k-message k-message--${message.role}`} aria-label={message.role === 'user' ? 'پیام تو' : 'پاسخ همراه آشپزی'}>
            <div className="k-message__label">{message.role === 'assistant' && <KitchenIcon />}<span>{message.role === 'user' ? 'تو' : 'همراه ات‌مت'}</span>{message.reply?.mode === 'catalog' && <small>پیشنهاد از مجموعهٔ رسپی‌ها</small>}</div>
            <p className="k-message__text" dir="auto">{message.text}</p>
            {message.reply?.recipe && <PersonalRecipe recipe={message.reply.recipe} onSave={() => { void saveMessage(message); }} saving={saving === message.id} saved={saved.some(r => r.messageId === message.id)} />}
            {!!message.reply?.links.length && <nav className="k-source-links" aria-label="منابع و پیشنهادهای مرتبط">{message.reply.links.map(link => <a key={link.href} href={link.href} {...(link.href.startsWith('https://') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{link.title}</a>)}</nav>}
          </article>)}
          {pending && <article className="k-message k-message--user"><div className="k-message__label">تو</div><p className="k-message__text" dir="auto">{pending.text}</p></article>}
          {busy && <div className="k-thinking" role="status"><KitchenIcon /><span>دارم مواد و رسپی‌ها را کنار هم می‌گذارم…</span><i /></div>}
          {!busy && !pending && lastReply && <div className="k-suggestions" aria-label="ادامهٔ گفتگو">{lastReply.suggestions.map(text => <button key={text} onClick={() => { void send({ text, requestId: crypto.randomUUID() }); }}>{text}</button>)}</div>}
          {saveNotice && <p className="k-notice" role="status">{saveNotice} <Link href="/account">آشپزخانهٔ من</Link></p>}
        </div>}
        {error && <div className="k-error k-chat-error" role="alert"><p>{error}</p>{pending ? <div className="k-inline-actions"><button className="k-button" disabled={busy} onClick={() => { void send(pending); }}>تلاش دوباره</button><button className="k-button k-button--soft" disabled={busy} onClick={() => { setDraft(pending.text); setPending(null); setError(''); if (id) sessionStorage.removeItem(draftKey(id)); composer.current?.focus(); }}>ویرایش پیام</button></div> : id && !user ? <div className="k-inline-actions"><Link className="k-button" href="/account">ورود به حساب</Link><Link className="k-button k-button--soft" href="/kitchen">گفتگوی تازه</Link></div> : <button className="k-button" onClick={() => location.reload()}>بازکردن دوباره</button>}</div>}
      </div>
      {id && <div className="k-composer-wrap"><form className="k-composer" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">پیامت به همراه آشپزی</label><textarea ref={composer} id="chat-message" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!busy && !pending && draft.trim().length > 1) e.currentTarget.form?.requestSubmit(); } }} placeholder="تعداد نفرات، مواد موجود یا سؤال بعدی…" rows={2} maxLength={2000} disabled={loading || !conversation} /><button className="k-button" disabled={busy || loading || !!pending || draft.trim().length < 2 || !conversation}>ارسال</button></form><p className="k-composer-note">{user?.guest ? 'برای نگه‌داشتن رسپی‌ها، یک حساب بساز. ' : ''}محدودیت غذایی را دقیق بگو و برچسب مواد را بررسی کن.</p></div>}
    </main>
    <dialog className="k-dialog" ref={dialog} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}><button className="k-icon-button k-dialog__close" aria-label="بستن ورود به حساب" onClick={() => dialog.current?.close()}><KitchenIcon name="close" /></button><AuthForm onSuccess={signedIn} /></dialog>
  </div>;
}
