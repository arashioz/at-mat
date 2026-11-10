'use client';

import { useEffect, useRef, useState } from 'react';
import { collaborationKinds, collaborationLabels, type CollaborationKind } from '../../../backend/src/common/collaboration';
import { CollectionState, faCount } from '../../components/AdminForms';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { apiFetch } from '../../lib/api';
import { SITE_URL } from '../../lib/media';
import './collaboration-admin.css';

type Request = {
  _id: string;
  kind: CollaborationKind;
  name: string;
  phone: string;
  city: string;
  email?: string;
  company?: string;
  jobArea?: string;
  resumeUrl?: string;
  details: string;
  reviewed: boolean;
  createdAt: string;
};
type RequestPage = { items: Request[]; total: number; pageSize: number };
type StatusFilter = '' | 'new' | 'reviewed';
const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

function CollaborationInbox() {
  const { token } = useAdminWorkspace();
  const [kind, setKind] = useState<CollaborationKind | ''>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<RequestPage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState('');
  const updating = useRef(false);

  useEffect(() => {
    const request = new AbortController();
    const query = new URLSearchParams({ page: String(page) });
    if (kind) query.set('kind', kind);
    if (status) query.set('status', status);
    setLoading(true);
    setError('');
    void apiFetch<RequestPage>(`/collaboration?${query}`, token, { signal: request.signal })
      .then(next => { if (!request.signal.aborted) setData(next); })
      .catch(problem => {
        if (!request.signal.aborted) setError(problem instanceof Error ? problem.message : 'درخواست‌ها دریافت نشدند.');
      })
      .finally(() => { if (!request.signal.aborted) setLoading(false); });
    return () => request.abort();
  }, [kind, page, status, token, version]);

  async function review(item: Request) {
    if (updating.current) return;
    updating.current = true;
    setReviewing(item._id);
    setReviewError('');
    try {
      const next = await apiFetch<{ reviewed: boolean }>(`/collaboration/${item._id}/review`, token, {
        method: 'PATCH', body: JSON.stringify({ reviewed: !item.reviewed }),
      });
      if (status) {
        if (data?.items.length === 1 && page > 1) setPage(current => current - 1);
        setVersion(current => current + 1);
      } else {
        setData(current => current && ({
          ...current,
          items: current.items.map(row => row._id === item._id ? { ...row, reviewed: next.reviewed } : row),
        }));
      }
    } catch (problem) {
      setReviewError(problem instanceof Error ? problem.message : 'وضعیت درخواست تغییر نکرد.');
    } finally {
      setReviewing(null);
      updating.current = false;
    }
  }

  return (
    <section className="admin-panel collaboration-inbox" aria-busy={loading}>
      <div className="admin-panel-head">
        <div><h2>صندوق درخواست‌ها</h2>{data && !loading && !error && <p role="status">{faCount(data.total)} درخواست</p>}</div>
        <div className="collaboration-inbox__filters">
          <label className="admin-field"><span>نوع درخواست</span>
            <select className="admin-input" value={kind} disabled={reviewing !== null} onChange={event => {
              setKind(event.target.value as CollaborationKind | ''); setPage(1); setReviewError('');
            }}>
              <option value="">همهٔ انواع</option>
              {collaborationKinds.map(value => <option key={value} value={value}>{collaborationLabels[value]}</option>)}
            </select>
          </label>
          <label className="admin-field"><span>وضعیت</span>
            <select className="admin-input" value={status} disabled={reviewing !== null} onChange={event => {
              setStatus(event.target.value as StatusFilter); setPage(1); setReviewError('');
            }}>
              <option value="">همهٔ وضعیت‌ها</option>
              <option value="new">تازه</option>
              <option value="reviewed">بررسی‌شده</option>
            </select>
          </label>
        </div>
      </div>
      <CollectionState loading={loading} error={error} empty={data?.items.length === 0 ? 'درخواستی در این فهرست وجود ندارد.' : undefined}
        onRetry={() => setVersion(current => current + 1)} />
      {reviewError && <p className="admin-alert admin-alert--error" role="alert">{reviewError}</p>}
      {!loading && !error && data && data.items.length > 0 && (
        <ul className="collaboration-inbox__list" role="list">
          {data.items.map(item => (
            <li key={item._id}>
              <details className="collaboration-inbox__request">
                <summary>
                  <span><strong>{item.name}</strong><small>{collaborationLabels[item.kind]} · {item.city}</small></span>
                  <span className={`admin-chip admin-chip--${item.reviewed ? 'live' : 'draft'}`}>{item.reviewed ? 'بررسی‌شده' : 'تازه'}</span>
                </summary>
                <div className="collaboration-inbox__details">
                  <dl>
                    <div><dt>تاریخ ثبت</dt><dd><time dateTime={item.createdAt}>{date.format(new Date(item.createdAt))}</time></dd></div>
                    <div><dt>شمارهٔ تماس</dt><dd><a href={`tel:${item.phone}`}><bdi>{item.phone}</bdi></a></dd></div>
                    {item.email && <div><dt>ایمیل</dt><dd><a href={`mailto:${encodeURIComponent(item.email).replace('%40', '@')}`}><bdi>{item.email}</bdi></a></dd></div>}
                    {item.company && <div><dt>نام مجموعه</dt><dd>{item.company}</dd></div>}
                    {item.jobArea && <div><dt>حوزهٔ کاری</dt><dd>{item.jobArea}</dd></div>}
                    {item.resumeUrl && /^https?:\/\//i.test(item.resumeUrl) && (
                      <div><dt>رزومه</dt><dd><a href={item.resumeUrl} target="_blank" rel="noopener noreferrer" title={item.resumeUrl}>باز کردن لینک رزومه</a></dd></div>
                    )}
                  </dl>
                  <div><h3>{item.kind === 'sales' ? 'سابقهٔ فروش و محدودهٔ پوشش' : 'تجربه و مهارت‌ها'}</h3><p>{item.details}</p></div>
                  <button type="button" className="admin-button admin-button--secondary" disabled={reviewing !== null} onClick={() => void review(item)}>
                    {reviewing === item._id ? 'در حال ثبت…' : item.reviewed ? 'بازگرداندن به تازه' : 'علامت‌گذاری به‌عنوان بررسی‌شده'}
                  </button>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      {!loading && !error && data && (page > 1 || data.total > data.pageSize) && (
        <nav className="admin-actions collaboration-inbox__pager" aria-label="صفحه‌های درخواست‌ها">
          <button className="admin-button admin-button--secondary" type="button" disabled={page === 1 || reviewing !== null} onClick={() => setPage(current => current - 1)}>صفحهٔ قبل</button>
          <span>صفحهٔ {faCount(page)} از {faCount(Math.max(1, Math.ceil(data.total / data.pageSize)))}</span>
          <button className="admin-button admin-button--secondary" type="button" disabled={page * data.pageSize >= data.total || reviewing !== null} onClick={() => setPage(current => current + 1)}>صفحهٔ بعد</button>
        </nav>
      )}
    </section>
  );
}

export default function CollaborationAdminPage() {
  return (
    <AppShell title="درخواست‌های همکاری" eyebrow="عملیات" description="درخواست‌های نمایندگی فروش و استخدام که از سایت ات‌مت ثبت شده‌اند."
      actions={<a className="admin-button admin-button--secondary" href={`${SITE_URL}/collaboration`} target="_blank" rel="noreferrer">مشاهدهٔ فرم‌های سایت</a>}>
      <CollaborationInbox />
    </AppShell>
  );
}
