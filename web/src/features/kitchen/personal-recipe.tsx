'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { KitchenRecipe } from './types';
import { KitchenIcon } from './kitchen-icons';

export function PersonalRecipe({ recipe, onSave, saved = false, saving = false }: { recipe: KitchenRecipe; onSave?: () => void; saved?: boolean; saving?: boolean }) {
  const [tab, setTab] = useState<'ingredients' | 'steps'>('ingredients');
  return <article className="k-recipe">
    <div className="k-recipe__head">{recipe.image && <img src={recipe.image} alt="تصویر دستور پایه" width={120} height={120} loading="lazy" />}<div><p className="k-eyebrow">از رسپی‌های ات‌مت، برای تو</p><h3>{recipe.title}</h3><div className="k-recipe__meta"><span>{recipe.servings.toLocaleString('fa-IR')} نفر</span><span>دستور پایه: {recipe.duration}</span></div></div></div>
    <p className="k-recipe__prep">{recipe.preparation}</p>
    <div className="k-tabs" role="group" aria-label="بخش‌های رسپی"><button aria-pressed={tab === 'ingredients'} onClick={() => setTab('ingredients')}>مواد و لیست خرید</button><button aria-pressed={tab === 'steps'} onClick={() => setTab('steps')}>قدم‌های پخت</button></div>
    <div hidden={tab !== 'ingredients'}><ul className="k-checklist">{recipe.ingredients.map((ingredient, i) => <li key={i}><label><input type="checkbox" /><span>{ingredient}</span></label></li>)}</ul><p className="k-small">موادی را که آماده کرده‌ای، علامت بزن.</p></div>
    <div hidden={tab !== 'steps'}><ol className="k-steps">{recipe.steps.map((step, i) => <li key={i}><label><input type="checkbox" aria-label={`${step.title} انجام شد`} /><span><strong>{(i + 1).toLocaleString('fa-IR')}. {step.title}</strong><span>{step.text}</span></span></label></li>)}</ol><aside className="k-tip">{recipe.tip}</aside></div>
    <div className="k-recipe__actions">{onSave && <button className={`k-button ${saved ? 'k-button--soft' : ''}`} onClick={onSave} disabled={saved || saving}><KitchenIcon name={saved ? 'check' : 'book'} />{saved ? 'در آشپزخانه‌ات ذخیره شد' : saving ? 'در حال ذخیره…' : 'ذخیره در آشپزخانهٔ من'}</button>}<Link className="k-button k-button--soft" href={`/recipes/${recipe.sourceSlug}`}>دیدن دستور اصلی</Link></div>
  </article>;
}
