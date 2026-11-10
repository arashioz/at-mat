'use client';

import { useMemo, useState } from 'react';
import type { RecipeCardData } from './data';
import { RecipeCard } from './recipe-card';

const filters = ['همه', 'سالاد', 'ساندویچ', 'پاستا و نودل', 'غذاهای گرم'];
const flavors = [['brine', 'آب‌نمک'], ['olive-oil', 'روغن زیتون'], ['sunflower', 'آفتابگردان'], ['pepper', 'فلفلی'], ['smoked', 'دودی'], ['dill', 'شویدی']];
const normalize = (text: string) => text.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u064b-\u065f]/g, ' ').replace(/\s+/g, ' ').trim();

export function RecipeBrowser({ recipes }: { recipes: RecipeCardData[] }) {
  const [filter, setFilter] = useState('همه');
  const [flavor, setFlavor] = useState('all');
  const [query, setQuery] = useState('');
  const visible = useMemo(() => recipes.filter(recipe => {
    const group = recipe.category.includes('سالاد') ? 'سالاد' : recipe.category === 'ساندویچ' ? 'ساندویچ' : ['پاستا', 'نودل'].includes(recipe.category) ? 'پاستا و نودل' : 'غذاهای گرم';
    return (filter === 'همه' || group === filter) && (flavor === 'all' || flavor === recipe.flavor) && normalize(`${recipe.title} ${recipe.intro} ${recipe.flavorLabel}`).includes(normalize(query));
  }), [recipes, filter, flavor, query]);
  const reset = () => { setFilter('همه'); setFlavor('all'); setQuery(''); };
  return (
    <section className="r-library" id="recipe-library" aria-labelledby="library-title">
      <div className="r-library__head" data-recipe-reveal><div><p className="r-section-label">رسپی‌های ات‌مت</p><h2 id="library-title">برای امروز،<br /><span>یک مزهٔ تازه.</span></h2></div><p>رسپی‌ها را بر اساس غذا یا طعم تن پیدا کن.</p></div>
      <div className="r-browser-tools"><div className="r-search-row">
        <label className="r-search at-search-control"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><span className="sr-only">جست‌وجو میان رسپی‌ها</span><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="امروز هوس چی کردی؟" /></label>
        <label className="r-flavor-select"><span className="sr-only">فیلتر بر اساس طعم تن ماهی</span><select value={flavor} onChange={e => setFlavor(e.target.value)}><option value="all">همهٔ طعم‌ها</option>{flavors.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      <div className="r-filter-row"><div className="r-filters" role="group" aria-label="دسته‌بندی رسپی‌ها">{filters.map(item => <button key={item} className="at-pill" type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div><p className="r-count" role="status" aria-live="polite">{visible.length.toLocaleString('fa-IR')} رسپی</p></div></div>
      {visible.length ? <div className="r-grid">{visible.map(recipe => <RecipeCard key={recipe.slug} recipe={recipe} />)}</div> : <div className="r-empty"><h3>این ترکیب را پیدا نکردیم.</h3><p>نام غذا یا طعم دیگری را امتحان کن.</p><button type="button" onClick={reset}>نمایش همهٔ رسپی‌ها</button></div>}
      <p className="r-library__footnote">زمان‌های رسپی از تنِ آماده حساب شده‌اند؛ ۲۰ دقیقه جوشاندن قوطی، جدا از زمان دستور است.</p>
    </section>
  );
}
