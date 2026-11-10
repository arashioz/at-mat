'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { collaborationKinds, collaborationLabels, employmentAreas, type CollaborationKind } from '../../../../backend/src/common/collaboration';

const options = {
  sales: { number: '۰۱', description: 'برای فروش و توزیع محصولات ات‌مت در محدودهٔ فعالیتت' },
  employment: { number: '۰۲', description: 'برای معرفی تجربه و مهارتت به تیم ات‌مت' },
} as const;

function ApplicationForm({ kind }: { kind: CollaborationKind }) {
  const id = useId();
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const attempt = useRef<{ body: string; id: string } | null>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const sales = kind === 'sales';
  const title = `درخواست ${collaborationLabels[kind]}`;

  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (submitted) confirmation.current?.focus();
  }, [submitted]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim();
    const fields = {
      kind,
      name: text('name'),
      phone: text('phone'),
      city: text('city'),
      email: text('email') || undefined,
      details: text('details'),
      ...(sales ? { company: text('company') || undefined } : {
        jobArea: text('jobArea'),
        resumeUrl: text('resumeUrl') || undefined,
      }),
    };
    pending.current = true;
    setSending(true);
    setError('');
    try {
      const body = JSON.stringify(fields);
      if (attempt.current?.body !== body) attempt.current = { body, id: crypto.randomUUID() };
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, requestId: attempt.current.id }),
        signal: AbortSignal.timeout(15000),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.accepted !== true) {
        const message = Array.isArray(result?.message) ? result.message.join(' ') : result?.message;
        setError(response.status === 400 && typeof message === 'string' ? message : 'ثبت درخواست انجام نشد. دوباره تلاش کنید.');
        return;
      }
      attempt.current = null;
      setSubmitted(true);
    } catch {
      setError('ارتباط برقرار نشد. دوباره تلاش کنید.');
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  if (submitted) return (
    <div className="company-form-result" role="status">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
      <h3 ref={confirmation} tabIndex={-1}>{title} ثبت شد.</h3>
      <p>تیم ات‌مت درخواست را بررسی می‌کند و در صورت نیاز با شمارهٔ ثبت‌شده تماس می‌گیرد.</p>
      <button className="company-button company-button--outline" type="button" onClick={() => setSubmitted(false)}>ثبت درخواست دیگر</button>
    </div>
  );

  return (
    <form className="company-form" method="post" onSubmit={submit} aria-labelledby={`${id}-title`} aria-busy={sending}>
      <header className="company-form__heading">
        <h3 id={`${id}-title`}>{title}</h3>
        <p>شماره‌ای وارد کن که بتوانیم برای پیگیری با تو تماس بگیریم.</p>
      </header>
      <fieldset disabled={!ready || sending} className="company-form__fields">
        <legend className="sr-only">اطلاعات {collaborationLabels[kind]}</legend>
        <label className="company-field">
          <span>نام و نام خانوادگی</span>
          <input className="at-control" name="name" autoComplete="name" required minLength={2} maxLength={100} />
        </label>
        <label className="company-field">
          <span>شمارهٔ موبایل</span>
          <input className="at-control" name="phone" type="tel" dir="ltr" autoComplete="tel" placeholder="09123456789" required maxLength={30} />
        </label>
        <label className="company-field">
          <span>{sales ? 'شهر و استان فعالیت' : 'شهر محل سکونت'}</span>
          <input className="at-control" name="city" required minLength={2} maxLength={100} />
        </label>
        <label className="company-field">
          <span>ایمیل <small>اختیاری</small></span>
          <input className="at-control" name="email" type="email" dir="ltr" autoComplete="email" maxLength={150} />
        </label>
        {sales ? (
          <label className="company-field company-field--wide">
            <span>نام مجموعه <small>اختیاری</small></span>
            <input className="at-control" name="company" autoComplete="organization" maxLength={120} />
          </label>
        ) : (
          <>
            <label className="company-field">
              <span>حوزهٔ کاری موردنظر</span>
              <select className="at-control" name="jobArea" required defaultValue="">
                <option value="" disabled>انتخاب حوزهٔ کاری</option>
                {employmentAreas.map(area => <option key={area}>{area}</option>)}
              </select>
            </label>
            <label className="company-field">
              <span>لینک رزومه <small>اختیاری</small></span>
              <input className="at-control" name="resumeUrl" type="url" dir="ltr" placeholder="https://…" maxLength={800} />
            </label>
          </>
        )}
        <label className="company-field company-field--wide">
          <span>{sales ? 'سابقهٔ فروش و محدودهٔ پوشش' : 'خلاصهٔ تجربه و مهارت‌ها'}</span>
          <textarea className="at-control" name="details" rows={4} required minLength={10} maxLength={1600}
            placeholder={sales ? 'مثلاً نوع فروش، شهرهای تحت پوشش و تجربهٔ پخش محصولات غذایی' : 'مثلاً تجربهٔ مرتبط، مهارت‌ها و نوع همکاری موردنظر'} />
        </label>
      </fieldset>
      {error && <p className="company-form__error" role="alert">{error}</p>}
      <div className="company-form__actions">
        <button className="company-button" type="submit" disabled={!ready || sending}>{sending ? 'در حال ثبت…' : 'ثبت درخواست'}</button>
        <p>اطلاعات برای بررسی همین درخواست و تماس با تو استفاده می‌شود.</p>
      </div>
    </form>
  );
}

export function CollaborationForm({ initialKind }: { initialKind: CollaborationKind }) {
  const [activeKind, setActiveKind] = useState(initialKind);
  return (
    <div className="company-application" id="application">
      <div className="company-options" role="group" aria-label="نوع همکاری">
        {collaborationKinds.map(kind => (
          <button className="company-option" key={kind} type="button" aria-pressed={activeKind === kind}
            aria-controls={`application-${kind}`} onClick={() => setActiveKind(kind)}>
            <span className="company-option__number" aria-hidden="true">{options[kind].number}</span>
            <span><strong>{collaborationLabels[kind]}</strong><small>{options[kind].description}</small></span>
            <span className="company-option__mark" aria-hidden="true" />
          </button>
        ))}
      </div>
      {collaborationKinds.map(kind => (
        <div key={kind} id={`application-${kind}`} hidden={activeKind !== kind}>
          <ApplicationForm kind={kind} />
        </div>
      ))}
    </div>
  );
}
