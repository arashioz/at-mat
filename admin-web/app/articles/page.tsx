'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { apiFetch, fetchMe, TOKEN_KEY } from '../../lib/api';
import recipes from '../../../web/src/features/recipes/content.json';

type Photo = { key: string; alt: string };
type Media = { key: string; url: string; description?: string; originalName: string };
type Article = {
  _id?: string; slug: string; title: string; category: string; excerpt: string; intro: string; author: string;
  seoTitle: string; metaDescription: string; tags: string[]; takeaways: string[];
  sections: { id: string; title: string; paragraphs: string[] }[];
  faq: { question: string; answer: string }[]; sources: { title: string; url: string }[];
  cover: Photo | null; bodyImage: Photo | null; relatedArticleSlugs: string[]; relatedRecipeSlugs: string[]; productSlugs: string[];
  status?: 'draft' | 'published'; publishedAt?: string; wordCount?: number;
};
const categories = ['تغذیه', 'سلامتی', 'هلث فود و سبک زندگی', 'ورزش', 'دنیای آبزیان'];
const products = [['brine', 'آب‌نمک'], ['sunflower', 'روغن آفتابگردان'], ['olive-oil', 'روغن زیتون'], ['pepper', 'فلفلی'], ['smoked', 'دودی'], ['dill', 'شوید']];
const empty = (): Article => ({ slug: '', title: '', category: categories[0], excerpt: '', intro: '', author: 'تحریریهٔ ات‌مت', seoTitle: '', metaDescription: '', tags: [], takeaways: [], sections: [], faq: [], sources: [], cover: null, bodyImage: null, relatedArticleSlugs: [], relatedRecipeSlugs: [], productSlugs: [] });
const input = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus:border-brand-600 focus:outline-none';
const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40';
function Field({ label, value, onChange, area = false, disabled = false, dir }: { label: string; value: string; onChange: (value: string) => void; area?: boolean; disabled?: boolean; dir?: string }) {
  return <label className="block space-y-1 text-sm"><span>{label}</span>{area ? <textarea className={input} rows={5} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} dir={dir} /> : <input className={input} value={value} onChange={e => onChange(e.target.value)} disabled={disabled} dir={dir} />}</label>;
}
const count = (a: Article) => [a.intro, ...a.sections.flatMap(s => s.paragraphs), ...a.faq.flatMap(q => [q.question, q.answer])].join(' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim().split(/\s+/u).filter(Boolean).length;
export default function ArticlesAdmin() {
  const [items, setItems] = useState<Article[]>([]), [media, setMedia] = useState<Media[]>([]), [draft, setDraft] = useState<Article | null>(null);
  const [ready, setReady] = useState(false), [allowed, setAllowed] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [search, setSearch] = useState('');
  const token = () => localStorage.getItem(TOKEN_KEY) ?? '';
  const load = async () => { const [rows, images] = await Promise.all([apiFetch<Article[]>('/articles', token()), apiFetch<Media[]>('/storage/images', token())]); setItems(rows); setMedia(images); };
  useEffect(() => { fetchMe(token()).then(async user => { const access = ['admin', 'super_admin'].includes(user.role); setAllowed(access); if (access) await load(); }).catch(e => setError(e.message)).finally(() => setReady(true)); }, []);
  const change = <K extends keyof Article>(key: K, value: Article[K]) => setDraft(d => d && ({ ...d, [key]: value }));
  function select(item: Article | null) { if (draft && !window.confirm('ویرایش‌های ذخیره‌نشده کنار گذاشته شوند؟')) return; setDraft(item ? structuredClone(item) : empty()); setError(''); setNotice(''); }
  async function act(action: () => Promise<void>) { setBusy(true); setError(''); setNotice(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'خطا در ذخیره'); } finally { setBusy(false); } }
  async function save(publish = false) {
    if (!draft) return;
    await act(async () => {
      const payload = Object.fromEntries(Object.keys(empty()).map(key => [key, draft[key as keyof Article]]));
      const saved = await apiFetch<Article>(draft._id ? `/articles/${draft._id}` : '/articles', token(), { method: draft._id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      setDraft(saved);
      if (publish) setDraft(await apiFetch<Article>(`/articles/${saved._id}/status`, token(), { method: 'PATCH', body: JSON.stringify({ status: 'published' }) }));
      await load(); setNotice(publish ? 'مقاله منتشر شد.' : 'تغییرات ذخیره شد.');
    });
  }
  async function upload(file: File | undefined, slot: 'cover' | 'bodyImage') {
    if (!file || !draft) return;
    await act(async () => { const form = new FormData(); form.append('file', file); form.append('category', 'general'); form.append('description', `article-${draft.slug || 'draft'}-${slot}`); const result = await apiFetch<Media>('/storage/images', token(), { method: 'POST', body: form }); setMedia(m => [...m, result]); change(slot, { key: result.key, alt: draft[slot]?.alt || draft.title }); setNotice('تصویر آپلود شد؛ مقاله را ذخیره کنید.'); });
  }
  const words = draft ? count(draft) : 0;
  const toggle = (key: 'relatedArticleSlugs' | 'relatedRecipeSlugs' | 'productSlugs', slug: string) => draft && change(key, draft[key].includes(slug) ? draft[key].filter(x => x !== slug) : [...draft[key], slug]);
  return <AppShell title="مدیریت مقالات">
    {!ready ? <p>در حال بارگذاری مقالات…</p> : !allowed ? <p role="alert">مدیریت مقالات فقط برای ادمین در دسترس است.</p> : <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600">{items.length.toLocaleString('fa-IR')} مقاله · {items.filter(x => x.status === 'published').length.toLocaleString('fa-IR')} منتشرشده</p><button className="rounded-lg bg-brand-600 px-4 py-2 text-white" onClick={() => select(null)} disabled={busy}>مقالهٔ جدید</button></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-green-800">{notice}</p>}
      <div className="grid items-start gap-5 xl:grid-cols-[280px_1fr]">
        <aside className="space-y-3 rounded-xl border bg-white p-4"><Field label="جست‌وجو در مقالات" value={search} onChange={setSearch} /><ul className="max-h-[65vh] space-y-2 overflow-auto">{items.filter(a => `${a.title} ${a.category} ${a.slug}`.includes(search)).map(a => <li key={a._id}><button onClick={() => select(a)} disabled={busy} className={`w-full rounded-lg border p-3 text-right text-sm ${draft?._id === a._id ? 'border-brand-600 bg-brand-50' : ''}`}><strong className="block">{a.title}</strong><span className="mt-2 block text-xs text-slate-500">{a.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'} · {a.wordCount?.toLocaleString('fa-IR')} کلمه</span></button></li>)}</ul></aside>
        {!draft ? <p className="rounded-xl border bg-white p-8 text-slate-500">برای ویرایش یک مقاله انتخاب کنید یا مقالهٔ جدید بسازید.</p> : <fieldset disabled={busy} className="min-w-0 space-y-5 rounded-xl border bg-white p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-bold">{draft._id ? 'ویرایش مقاله' : 'مقالهٔ جدید'}</h2><span className={words >= 700 && words <= 1500 ? 'text-green-700' : 'text-amber-700'}>{words.toLocaleString('fa-IR')} / ۷۰۰ تا ۱۵۰۰ کلمه</span><span className="text-xs text-slate-500">{draft.status === 'published' ? 'منتشرشده؛ ذخیره نسخهٔ سایت را به‌روز می‌کند.' : 'پیش‌نویس'}</span></div>
          {(['title', 'slug', 'excerpt', 'intro', 'author', 'seoTitle', 'metaDescription'] as const).map((key, i) => <Field key={key} label={['عنوان', 'آدرس انگلیسی (slug)', 'خلاصهٔ کارت', 'مقدمه', 'نویسنده', 'عنوان سئو (حداکثر ۱۰۰ نویسه)', 'توضیح متا (حداکثر ۲۰۰ نویسه)'][i]} value={draft[key]} onChange={v => change(key, v)} area={['excerpt', 'intro', 'metaDescription'].includes(key)} disabled={key === 'slug' && !!draft.publishedAt} dir={key === 'slug' ? 'ltr' : undefined} />)}
          <label className="block text-sm">دسته‌بندی<select className={input} value={draft.category} onChange={e => change('category', e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
          {(['takeaways', 'tags'] as const).map(key => <Field key={key} label={key === 'tags' ? 'برچسب‌ها؛ هر مورد در یک خط' : 'نکته‌های کلیدی؛ هر مورد در یک خط'} value={draft[key].join('\n')} onChange={v => change(key, v.split('\n'))} area />)}
          <section className="space-y-4 border-t pt-5"><h3 className="font-bold">بخش‌های مقاله</h3><p className="text-xs text-slate-500">پاراگراف‌ها را با یک خط خالی جدا کنید. پیوند داخلی: [عنوان](/articles/label-reading) یا /recipes/ و /flavors/.</p>
            {draft.sections.map((s, i) => <div key={i} className="space-y-3 rounded-lg border p-3">
              <Field label={`عنوان بخش ${(i + 1).toLocaleString('fa-IR')}`} value={s.title} onChange={v => change('sections', draft.sections.map((x, n) => n === i ? { ...x, title: v } : x))} />
              <Field label="شناسهٔ بخش (انگلیسی، بدون فاصله)" value={s.id} onChange={v => change('sections', draft.sections.map((x, n) => n === i ? { ...x, id: v } : x))} dir="ltr" />
              <Field label="متن بخش" value={s.paragraphs.join('\n\n')} onChange={v => change('sections', draft.sections.map((x, n) => n === i ? { ...x, paragraphs: v.split(/\n\s*\n/) } : x))} area />
              <div className="flex gap-2"><button className={button} disabled={!i} onClick={() => { const rows = [...draft.sections]; [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]]; change('sections', rows); }}>بالاتر</button><button className={button} disabled={i === draft.sections.length - 1} onClick={() => { const rows = [...draft.sections]; [rows[i + 1], rows[i]] = [rows[i], rows[i + 1]]; change('sections', rows); }}>پایین‌تر</button><button className={button} onClick={() => change('sections', draft.sections.filter((_, n) => n !== i))}>حذف بخش</button></div>
            </div>)}<button className={button} onClick={() => change('sections', [...draft.sections, { id: `section-${Date.now()}`, title: '', paragraphs: [''] }])}>افزودن بخش</button>
          </section>
          <section className="space-y-3 border-t pt-5"><h3 className="font-bold">تصاویر مقاله</h3>{(['cover', 'bodyImage'] as const).map(slot => <div key={slot} className="space-y-3 rounded-lg border p-3"><h4>{slot === 'cover' ? 'تصویر کاور' : 'تصویر داخل مقاله'}</h4><label className="block text-sm">انتخاب از مخزن<select className={input} value={draft[slot]?.key ?? ''} onChange={e => change(slot, e.target.value ? { key: e.target.value, alt: draft[slot]?.alt || draft.title } : null)}><option value="">بدون تصویر</option>{media.filter(m => /^(general|products|branding)\//.test(m.key)).map(m => <option key={m.key} value={m.key}>{m.description || m.originalName}</option>)}</select></label><label className="block text-sm">آپلود تصویر جدید<input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block w-full" onChange={e => { void upload(e.target.files?.[0], slot); e.target.value = ''; }} /></label>{draft[slot] && <><img className="max-h-48 rounded-lg object-contain" src={media.find(m => m.key === draft[slot]?.key)?.url} alt={draft[slot]?.alt} /><Field label="توضیح تصویر" value={draft[slot]?.alt ?? ''} onChange={v => change(slot, { key: draft[slot]!.key, alt: v })} /></>}</div>)}</section>
          <section className="space-y-3 border-t pt-5"><h3 className="font-bold">پرسش‌های متداول</h3>{draft.faq.map((q, i) => <div key={i} className="space-y-2 rounded-lg border p-3"><Field label="پرسش" value={q.question} onChange={v => change('faq', draft.faq.map((x, n) => i === n ? { ...x, question: v } : x))} /><Field label="پاسخ" value={q.answer} onChange={v => change('faq', draft.faq.map((x, n) => i === n ? { ...x, answer: v } : x))} area /><button className={button} onClick={() => change('faq', draft.faq.filter((_, n) => n !== i))}>حذف پرسش</button></div>)}<button className={button} onClick={() => change('faq', [...draft.faq, { question: '', answer: '' }])}>افزودن پرسش</button></section>
          <section className="space-y-3 border-t pt-5"><h3 className="font-bold">منابع</h3>{draft.sources.map((s, i) => <div key={i} className="space-y-2 rounded-lg border p-3"><Field label="عنوان منبع" value={s.title} onChange={v => change('sources', draft.sources.map((x, n) => i === n ? { ...x, title: v } : x))} /><Field label="آدرس منبع" value={s.url} onChange={v => change('sources', draft.sources.map((x, n) => i === n ? { ...x, url: v } : x))} dir="ltr" /><button className={button} onClick={() => change('sources', draft.sources.filter((_, n) => n !== i))}>حذف منبع</button></div>)}<button className={button} onClick={() => change('sources', [...draft.sources, { title: '', url: '' }])}>افزودن منبع</button></section>
          <section className="space-y-3 border-t pt-5"><h3 className="font-bold">لینک‌سازی داخلی (حداکثر ۶ در هر گروه)</h3>{(['relatedArticleSlugs', 'relatedRecipeSlugs', 'productSlugs'] as const).map(key => <div key={key}><h4 className="mb-2 text-sm">{key === 'relatedArticleSlugs' ? 'مقالات مرتبط' : key === 'relatedRecipeSlugs' ? 'رسپی‌های مرتبط؛ پیوند دوطرفه' : 'محصولات'}</h4><div className="grid gap-2 md:grid-cols-2">{(key === 'relatedArticleSlugs' ? items.filter(x => x.slug !== draft.slug).map(a => [a.slug, a.title]) : key === 'relatedRecipeSlugs' ? recipes.map(r => [r.slug, r.title]) : products).map(([slug, label]) => <label key={slug} className="flex gap-2 text-sm"><input type="checkbox" checked={draft[key].includes(slug)} onChange={() => toggle(key, slug)} />{label}</label>)}</div></div>)}</section>
          <div className="sticky bottom-16 z-10 flex flex-wrap gap-2 rounded-xl border bg-white/95 p-3 shadow-sm md:bottom-2"><button className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void save()}>{busy ? 'در حال انجام…' : 'ذخیرهٔ تغییرات'}</button>{draft.status !== 'published' && <button className={button} disabled={words < 700 || words > 1500} onClick={() => void save(true)}>ذخیره و انتشار</button>}{draft._id && draft.status === 'published' && <button className={button} onClick={() => void act(async () => { setDraft(await apiFetch<Article>(`/articles/${draft._id}/status`, token(), { method: 'PATCH', body: JSON.stringify({ status: 'draft' }) })); await load(); setNotice('مقاله به پیش‌نویس برگشت.'); })}>بازگردانی به پیش‌نویس</button>}{draft.status === 'published' && <a className={button} href={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002'}/articles/${draft.slug}`} target="_blank" rel="noreferrer">مشاهده در سایت</a>}{draft._id && draft.status === 'draft' && <button className={`${button} text-red-700`} onClick={() => { if (window.confirm('این پیش‌نویس حذف شود؟')) void act(async () => { await apiFetch(`/articles/${draft._id}`, token(), { method: 'DELETE' }); setDraft(null); await load(); setNotice('پیش‌نویس حذف شد.'); }); }}>حذف پیش‌نویس</button>}</div>
        </fieldset>}
      </div>
    </div>}
  </AppShell>;
}
