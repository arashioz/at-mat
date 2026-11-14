'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AdminIcon } from '../../components/AdminIcon';
import { apiFetch } from '../../lib/api';
import type { Answer, Source } from './brand-book-api';

const prompts = ['جوهره و شعار ات‌مت چیست؟', 'پایلوت چهار هفته‌ای چگونه اجرا می‌شود؟', 'لحن نوشتاری برند چگونه است؟', 'مسیر QR قوطی به رسپی چیست؟'];
type Exchange = { question: string; matches: Answer[] };

export function BrandChat({ token, sources, onClose, onChapter }: {
  token: string; sources: Source[]; onClose: () => void; onChapter: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { if (!dialog.current?.open) dialog.current?.showModal(); }, []);
  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [exchanges, pending]);

  async function ask(text: string) {
    if (!text.trim() || pending) return;
    setQuestion(text);
    setPending(text.trim());
    setError('');
    try {
      const result = await apiFetch<{ matches: Answer[] }>('/brand-book/questions', token, {
        method: 'POST', body: JSON.stringify({ question: text.trim() }),
      });
      setExchanges(items => [...items, { question: text.trim(), matches: result.matches }]);
      setQuestion('');
    } catch {
      setError('دریافت پاسخ انجام نشد. دوباره تلاش کنید.');
    } finally {
      setPending('');
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void ask(question); }

  return <dialog ref={dialog} className="brand-chat" aria-labelledby="brand-chat-title" onClose={onClose}>
    <div className="brand-chat-inner">
      <header className="brand-chat-head">
        <span className="brand-chat-icon" aria-hidden="true"><AdminIcon name="chat" size={22} /></span>
        <div><h2 id="brand-chat-title">دستیار برند</h2><p>پاسخ از متن برند بوک با ارجاع به فصل و سند</p></div>
        <button type="button" className="admin-icon-button" aria-label="بستن دستیار برند" onClick={() => dialog.current?.close()}><AdminIcon name="close" /></button>
      </header>
      <div ref={feed} className="brand-chat-feed" role="log" aria-live="polite" aria-label="گفتگو با دستیار برند">
        {exchanges.length === 0 && !pending && <div className="brand-chat-prompts"><h3>پرسش‌های پیشنهادی</h3>{prompts.map(prompt => <button type="button" key={prompt} onClick={() => void ask(prompt)}>{prompt}<AdminIcon name="arrow" size={16} /></button>)}</div>}
        {exchanges.map((exchange, index) => <div className="brand-exchange" key={index}>
          <p className="brand-question" dir="auto">{exchange.question}</p>
          {exchange.matches.length ? exchange.matches.map((match, matchIndex) => <article className="brand-answer" key={matchIndex}>
            <h3>{match.title}</h3><p>{match.text}</p>
            <button type="button" className="brand-download" onClick={() => { dialog.current?.close(); onChapter(match.chapterId); }}>{match.chapterTitle} <AdminIcon name="arrow" size={15} /></button>
            {match.references.length > 0 && <ul>{match.references.map((reference, refIndex) => <li key={refIndex}>{sources.find(source => source.id === reference.source)?.label} · {reference.location}</li>)}</ul>}
          </article>) : <p className="brand-answer">بخشی با این پرسش پیدا نشد. نام موضوع یا واژه‌ای مثل «پایلوت»، «نشان» یا «قفسه» را امتحان کنید.</p>}
        </div>)}
        {pending && <div className="brand-exchange">
          <p className="brand-question" dir="auto">{pending}</p>
          <p className="brand-chat-pending">در حال جست‌وجو در برند بوک <span aria-hidden="true"><i /><i /><i /></span></p>
        </div>}
      </div>
      <form className="brand-chat-form" onSubmit={submit}>
        {error && <p className="admin-alert admin-alert--error" role="alert">{error}</p>}
        <label className="admin-field">پرسش دربارهٔ برند<textarea className="admin-input" value={question} dir="auto" maxLength={500} disabled={Boolean(pending)} onChange={event => setQuestion(event.target.value)} placeholder="مثلاً پایلوت در چه کانال‌هایی اجرا می‌شود؟" /></label>
        <button type="submit" className="admin-button admin-button--primary" disabled={Boolean(pending) || !question.trim()}>ارسال پرسش<AdminIcon name="arrow" size={16} /></button>
      </form>
    </div>
  </dialog>;
}
