import Link from 'next/link';
import type { RecipeCardData } from './data';

export function RecipeArrow({ className = '' }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 12H4m6-6-6 6 6 6" /></svg>;
}

export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  const cover = recipe.photos['cover-a'];
  return (
    <article className={`r-card ${cover ? '' : 'r-card--type'}`} data-flavor={recipe.flavor}>
      <Link href={`/recipes/${recipe.slug}`} className="r-card__link">
        {cover && <div className="r-card__image"><img src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} loading="lazy" decoding="async" /><span className="r-card__tag">{recipe.category}</span></div>}
        <div className="r-card__content">
        <div className="r-card__meta"><span>{recipe.duration}</span><span>تن {recipe.flavorLabel}</span></div>
        <div className="r-card__heading"><h3>{recipe.title}</h3></div>
        {!cover && <><p className="r-card__intro">{recipe.intro}</p><span className="r-card__read">دیدن دستور <RecipeArrow /></span></>}
        </div>
      </Link>
    </article>
  );
}
