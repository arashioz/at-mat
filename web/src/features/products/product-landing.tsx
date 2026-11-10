import type { CSSProperties } from 'react';
import { BrineCurrent } from '@/features/brine/brine-current';
import { WeightBadge } from '@/features/brine/weight-badge';
import { IngredientTabs } from '@/features/brine/ingredient-tabs';
import { BrandEdge } from '@/features/brine/brand-edge';
import { BrineNutrition } from '@/features/brine/brine-nutrition';
import { BrineMotion } from '@/features/brine/brine-motion';
import { CanStage } from '@/features/brine/can-stage';
import { getFlavorMedia } from './media';
import type { FlavorDefinition } from './types';
import { SiteNavigation } from '@/features/site/site-navigation';
import { SiteFooter } from '@/features/site/site-footer';
import { getPublishedRecipes } from '@/features/recipes/data';
import './product-landing.css';

export async function ProductLanding({ product, staticMode }: { product: FlavorDefinition; staticMode: boolean }) {
  const copy = product.copy;
  const [media, published] = await Promise.all([getFlavorMedia(product.mediaPrefix), getPublishedRecipes().catch(() => [])]);
  const { recipes } = copy;
  const publishedBySlug = new Map(published.map(recipe => [recipe.slug, recipe]));
  const ideas = recipes.items.flatMap(recipe => {
    const live = publishedBySlug.get(recipe.href.slice('/recipes/'.length));
    if (!live) return [];
    const image = media.ideas[recipe.image] ?? live.photos['cover-a'];
    return image ? [{ recipe, image }] : [];
  });
  const theme = product.theme;
  const style = {
    '--brine-blue': theme.accent, '--brine-deep': theme.deep, '--brine-navy': theme.navy,
    '--brine-ice': theme.pale, '--product-notes': theme.notes,
    '--hero-ink': theme.heroText ?? '#f4fbfe',
    '--hero-top': theme.heroTop, '--hero-bottom': theme.heroBottom, '--hero-glow': theme.heroGlow,
  } as CSSProperties;
  const posterStyle = { '--wrap': `url("${media.wrapSmall.url}")`, '--lid': `url("${media.lid.url}")` } as CSSProperties;

  return (
    <BrineMotion key={product.slug} staticMode={staticMode} style={style} flavor={product.slug}>
      <noscript><style>{'.b-loader{display:none!important}html.is-loading{overflow:auto!important}'}</style></noscript>
      <CanStage wrap={media.wrap} wrapSmall={media.wrapSmall} lid={media.lid} staticMode={staticMode} netWeight={copy.netWeight} lightColor={theme.light} />

      <SiteNavigation logo={media.logo.url} flavor={product.slug} />

      <main id="main-content" tabIndex={-1}>
        <section className="b-hero" aria-labelledby="brine-title">
          <BrineCurrent phase="hero" staticMode={staticMode} lightColor={theme.light} />
          <h1 id="brine-title" className="b-hero__title">
            {copy.headline.map((line) => (
              <span className="b-mask" key={line}><span data-line>{line}</span></span>
            ))}
          </h1>
          <div className="b-hero__can" data-can-slot="hero">
            <figure className="b-poster" style={posterStyle}>
              <span className="b-poster__body" />
              <span className="b-poster__lid" />
              <figcaption className="sr-only">بسته‌بندی ات‌مت، {copy.name}</figcaption>
            </figure>
          </div>
        </section>

        <section className="b-detail" id="details" aria-labelledby="details-title">
          <BrandEdge id="details-logo-start" className="b-detail__edge" fillBelow />
          <div className="b-detail__stage">
            <header className="b-detail__head">
              <p className="b-kicker"><b>۰۱</b>ترکیبات قوطی</p>
              <h2 id="details-title" className="b-detail__title">{copy.name}</h2>
              <p className="b-detail__description">{copy.description}</p>
              <p className="sr-only">{copy.netWeight} گرم، وزن خالص</p>
            </header>
            <div className="b-detail__can" data-can-slot="stage" aria-hidden="true">
              <div className="b-poster" style={posterStyle}>
                <span className="b-poster__body" />
                <span className="b-poster__lid" />
              </div>
              <WeightBadge weight={copy.netWeight} className="b-detail__badge" />
            </div>
            <div className="b-detail__ingredients"><IngredientTabs steps={copy.steps} /></div>
          </div>
        </section>

        <BrineNutrition nutrition={copy.nutrition} />

        <section className="b-notes" aria-label="نکته‌های مصرف">
          <ul className="b-notes__row">
            {copy.notes.map((note) => (
              <li key={note.figure} className="b-note">
                <p className="b-note__figure"><b>{note.figure}</b><span>{note.unit}</span></p>
                <p className="b-note__text">{note.text}</p>
              </li>
            ))}
          </ul>
          <p className="b-notes__small">{copy.storage} {copy.warning}</p>
        </section>

        <section className="b-recipes" id="recipes" aria-labelledby="recipes-title">
          <BrandEdge id="recipes-logo-start" className="b-recipes__edge" />
          <header className="b-recipes__head">
            <p className="b-kicker" data-reveal><b>۰۳</b>پیشنهاد سرو</p>
            <h2 id="recipes-title">
              {recipes.title.map((line) => (
                <span className="b-mask" key={line}><span data-line>{line}</span></span>
              ))}
            </h2>
            <p className="b-recipes__note" data-reveal>{recipes.note}</p>
          </header>
          {ideas.length ? <ol className="b-cards">
            {ideas.map(({ recipe, image }) => {
              return (
                <li key={recipe.id} className="b-card" data-card>
                  <div className="b-card__scroll">
                    <div className="b-card__body">
                      <a className="b-card__link" href={recipe.href} aria-label={`دستور تهیهٔ ${recipe.title}`}>
                      <figure className="b-card__media" data-tilt>
                        <img src={image.url} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
                        <span className="b-card__num" aria-hidden="true">{recipe.numeral}</span>
                        <figcaption>
                          <span className="b-card__title">{recipe.title}</span>
                          <p className="b-card__line">{recipe.line}</p>
                        </figcaption>
                      </figure>
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol> : <p className="b-recipes__note"><a href="/recipes" className="r-text-link">همهٔ دستورهای پخت ←</a></p>}
        </section>
      </main>

      <SiteFooter logo={media.logo.url} flavor={product.slug} headline={copy.headline} />
    </BrineMotion>
  );
}
