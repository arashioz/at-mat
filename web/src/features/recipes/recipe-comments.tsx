'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  recipeCommentLimits as limits, type PublicRecipeComment, type RecipeCommentPage,
} from '../../../../backend/src/recipes/recipe-comments.contract';
import './recipe-comments.css';

const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' });
const number = new Intl.NumberFormat('fa-IR');

function mergeComments(existing: PublicRecipeComment[], incoming: PublicRecipeComment[]) {
  const known = new Set(existing.map(comment => comment.id));
  return [...existing, ...incoming.filter(comment => !known.has(comment.id))];
}

async function getComments(endpoint: string, signal?: AbortSignal): Promise<RecipeCommentPage> {
  const response = await fetch(endpoint, { cache: 'no-store', signal: signal ?? AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Could not load recipe comments.');
  return response.json() as Promise<RecipeCommentPage>;
}

export function RecipeComments({ slug }: { slug: string }) {
  const endpoint = `/api/recipes/${encodeURIComponent(slug)}/comments`;
  const [comments, setComments] = useState<PublicRecipeComment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [reload, setReload] = useState(0);
  const [ready, setReady] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string }>();
  const pending = useRef(false);
  const attempt = useRef<{ text: string; id: string } | undefined>(undefined);

  useEffect(() => {
    setReady(true);
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]);
    getComments(endpoint, signal).then(page => {
      if (controller.signal.aborted) return;
      setComments(current => mergeComments(current, page.items));
      setCursor(page.nextCursor);
      setLoadState('ready');
    }).catch(() => {
      if (!controller.signal.aborted) setLoadState('error');
    });
    return () => controller.abort();
  }, [endpoint, reload]);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setMoreError(false);
    try {
      const page = await getComments(`${endpoint}?before=${encodeURIComponent(cursor)}`);
      setComments(current => mergeComments(current, page.items));
      setCursor(page.nextCursor);
    } catch {
      setMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending.current) return;
    setFeedback(undefined);
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const message = draft.trim();
    if (name.length < limits.nameMin || message.length < limits.messageMin) {
      setFeedback({ kind: 'error', message: 'نام نمایشی و متن دیدگاه رو کامل کن.' });
      return;
    }

    pending.current = true;
    setSending(true);
    try {
      const text = JSON.stringify({ name, message });
      if (attempt.current?.text !== text) attempt.current = { text, id: crypto.randomUUID() };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, requestId: attempt.current.id }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('Could not save recipe comment.');
      const comment = await response.json() as PublicRecipeComment;
      setComments(current => mergeComments([comment], current));
      setDraft('');
      setFeedback({ kind: 'success', message: 'دیدگاهت ثبت شد.' });
      attempt.current = undefined;
    } catch {
      setFeedback({ kind: 'error', message: 'ثبت دیدگاه انجام نشد. متن را نگه داشتیم، دوباره تلاش کن.' });
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  return (
    <section className="r-comments" id="recipe-comments" aria-labelledby="recipe-comments-title">
      <div className="r-comments__inner">
        <header className="r-comments__head">
          <h2 id="recipe-comments-title">دیدگاه‌ها</h2>
          <p>این رسپی رو امتحان کردی؟ تجربه یا نکته‌ات رو بنویس.</p>
        </header>
        <div className="r-comments__layout">
          <form className="r-comments__form" method="post" onSubmit={submit} aria-busy={sending}>
            <fieldset disabled={!ready || sending}>
              <label className="r-comments__field">
                <span>نام نمایشی</span>
                <input className="at-control" name="name" dir="auto" autoComplete="nickname" required
                  minLength={limits.nameMin} maxLength={limits.nameMax} placeholder="نامی که کنار دیدگاهت دیده می‌شه" />
              </label>
              <label className="r-comments__field">
                <span>دیدگاهت</span>
                <textarea className="at-control" name="message" dir="auto" rows={4} required
                  minLength={limits.messageMin} maxLength={limits.messageMax} value={draft}
                  onChange={event => setDraft(event.target.value)} placeholder="چطور شد؟" aria-describedby="recipe-comment-limit" />
              </label>
            </fieldset>
            <div className="r-comments__form-actions">
              <button className="r-comments__submit at-pill" type="submit" disabled={!ready || sending}>
                {sending ? 'در حال ثبت…' : 'ثبت دیدگاه'}
              </button>
              <span className="r-comments__limit" id="recipe-comment-limit">
                {number.format(draft.length)} از {number.format(limits.messageMax)} نویسه
              </span>
            </div>
            {feedback && <p className="r-comments__feedback" data-kind={feedback.kind}
              role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
          </form>
          <div className="r-comments__thread" aria-busy={loadState === 'loading' || loadingMore}>
            {comments.length > 0 && (
              <ol className="r-comments__list">
                {comments.map(comment => (
                  <li className="r-comments__item" key={comment.id}>
                    <div className="r-comments__byline">
                      <span className="r-comments__avatar" aria-hidden="true">{Array.from(comment.name)[0]}</span>
                      <strong dir="auto">{comment.name}</strong>
                      <time dateTime={comment.createdAt}>{date.format(new Date(comment.createdAt))}</time>
                    </div>
                    <p dir="auto">{comment.message}</p>
                  </li>
                ))}
              </ol>
            )}
            {loadState === 'loading' && <p className="r-comments__note" role="status">در حال دریافت دیدگاه‌ها…</p>}
            {loadState === 'ready' && !comments.length && (
              <p className="r-comments__note">هنوز کسی دیدگاهی ننوشته. تو می‌تونی اولین نفر باشی.</p>
            )}
            {loadState === 'error' && (
              <div className="r-comments__note">
                <p role="status">دیدگاه‌ها فعلاً بارگذاری نشدن.</p>
                <button type="button" className="r-comments__more" onClick={() => {
                  setLoadState('loading');
                  setReload(value => value + 1);
                }}>تلاش دوباره</button>
              </div>
            )}
            {cursor && (
              <button type="button" className="r-comments__more" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'در حال دریافت…' : 'دیدگاه‌های بیشتر'}
              </button>
            )}
            {moreError && <p className="r-comments__feedback" data-kind="error" role="alert">دیدگاه‌های بیشتر بارگذاری نشدن.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
