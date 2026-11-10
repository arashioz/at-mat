'use client';
import { useMemo, useState } from 'react';
import { ArticleCard } from './article-card';
import { articleCategories, type ArticleCardData } from './types';
const normalize = (s: string) => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u064b-\u065f]/g, ' ').replace(/\s+/g, ' ').trim();
export function ArticleBrowser({ articles }: { articles: ArticleCardData[] }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('همه');
  const visible = useMemo(() => articles.filter(a => (category === 'همه' || a.category === category) && normalize(`${a.title} ${a.excerpt} ${a.tags.join(' ')}`).includes(normalize(query))), [articles, category, query]);
  return <section className="a-library" id="article-library" aria-labelledby="article-library-title">
    <div className="a-library__heading"><div><p className="r-section-label">برای انتخاب‌های هر روز</p><h2 id="article-library-title">یه کم بیشتر<br /><span>بدونیم.</span></h2></div><label className="a-search at-search-control"><span className="sr-only">جست‌وجو در مقاله‌ها</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="دنبال چه موضوعی هستی؟" /><span aria-hidden="true">⌕</span></label></div>
    <div className="a-filters"><div role="group" aria-label="دسته‌بندی مقاله‌ها">{['همه', ...articleCategories].map(c => <button key={c} className="at-pill" type="button" aria-pressed={c === category} onClick={() => setCategory(c)}>{c}</button>)}</div><p aria-live="polite" role="status">{visible.length.toLocaleString('fa-IR')} مقاله</p></div>
    {visible.length ? <div className="a-grid">{visible.map(a => <ArticleCard key={a.slug} article={a} />)}</div> : <div className="a-empty"><h3>این موضوع رو پیدا نکردیم.</h3><p>موضوع دیگری بنویس یا دسته‌بندی را تغییر بده.</p><button type="button" onClick={() => { setQuery(''); setCategory('همه'); }}>همهٔ مقاله‌ها</button></div>}
  </section>;
}
