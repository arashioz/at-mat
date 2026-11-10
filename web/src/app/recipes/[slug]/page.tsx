import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { recipeCopy, recipeGalleryCaptions, resolvePageText } from '../../../../../backend/src/common/content-copy';
import { getRecipeAssets, toRecipeCard, flavorPages, faNumber } from '@/features/recipes/data';
import { RecipeShell } from '@/features/recipes/recipe-shell';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { RecipeClockIcon, RecipeServingsIcon, RecipeDifficultyIcon, RecipeDownIcon } from '@/features/recipes/recipe-icons';
import { BrandEdge } from '@/features/brine/brand-edge';
import { RecipeSectionNav } from '@/features/recipes/recipe-section-nav';
import { ArticlesForRecipe } from '@/features/articles/related-to-recipe';
import { relatedRecipesFor } from '@/features/editorial/related';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { recipes, logo } = await getRecipeAssets();
  const { slug } = await params;
  const recipe = recipes.find(item => item.slug === slug);
  if (!recipe) notFound();
  return { title: recipe.seoTitle, description: recipe.metaDescription, icons: { icon: logo }, alternates: { canonical: `/recipes/${recipe.slug}` } };
}

function HeadingText({ value, inline = false }: { value: string; inline?: boolean }) {
  const [first, ...rest] = value.split('\n');
  if (!rest.length) return first;
  return <>{first}{inline ? ' ' : <br />}<span>{rest.join(' ')}</span></>;
}

export default async function RecipePage({ params }: Props) {
  const { recipes, logo } = await getRecipeAssets();
  const { slug } = await params;
  const recipe = recipes.find(item => item.slug === slug);
  if (!recipe) notFound();
  const text = resolvePageText(recipeCopy, recipe.pageText);
  const cover = recipe.photos['cover-a'];
  const ingredientsPhoto = recipe.photos.ingredients;
  const gallery = Object.entries(recipeGalleryCaptions).flatMap(([slot, caption]) => {
    const photo = recipe.photos[slot];
    return photo ? [{ slot, photo, caption: photo.caption ?? caption }] : [];
  });
  const related = relatedRecipesFor(recipes, slug, recipe.category, recipe.relatedRecipeSlugs);
  const extraSections = recipe.extraSections ?? [];

  return (
    <RecipeShell logo={logo} flavor={recipe.flavor}>
      <main id="main-content" tabIndex={-1}>
        <article key={recipe.slug}>
          <header className={`r-detail-hero${cover ? '' : ' r-detail-hero--text'}`}>
            <nav className="r-breadcrumb" aria-label="مسیر صفحه">
              <Link href="/recipes">رسپی‌ها</Link><span aria-hidden="true">/</span><span>{recipe.category}</span>
            </nav>
            <div className="r-detail-hero__layout">
              <div className="r-detail-hero__copy">
                <p className="r-kicker"><b>{recipe.number}</b>با تن {recipe.flavorLabel}</p>
                <h1><span className="r-mask"><span data-recipe-line>{recipe.title}</span></span></h1>
                <p className="r-detail-hero__intro">{recipe.intro}</p>
                <div className="r-detail-meta">
                  <dl>
                    <div><dt><RecipeClockIcon /><span>زمان تهیه</span></dt><dd>{recipe.duration}</dd></div>
                    <div><dt><RecipeServingsIcon /><span>برای</span></dt><dd>{recipe.servings}</dd></div>
                    <div><dt><RecipeDifficultyIcon /><span>درجهٔ سختی</span></dt><dd>{recipe.difficulty}</dd></div>
                  </dl>
                  {recipe.timing && recipe.timing !== recipe.duration && <p className="r-detail-timing">{recipe.timing}</p>}
                </div>
                <div className="r-detail-actions">
                  <a className="r-hero-cta" href="#ingredients-title">{text.startCooking} <span><RecipeDownIcon /></span></a>
                </div>
              </div>
              {cover && <div className="r-detail-hero__visual" data-recipe-photo>
                <figure className="r-detail-cover">
                  <img src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} fetchPriority="high" />
                  {cover.caption && <figcaption className="r-cover-caption">{cover.caption}</figcaption>}
                </figure>
              </div>}
            </div>
            <BrandEdge id="recipe-method-edge" className="r-detail-hero__edge" fillBelow />
          </header>

          <RecipeSectionNav hasExtraSections={extraSections.length > 0} />
          <div className="r-cook-layout">
            <aside className="r-ingredients" id="ingredients" aria-labelledby="ingredients-title">
              <div className="r-ingredients__heading">
                <p className="r-section-label">{text.ingredientsLabel}</p>
                <h2 id="ingredients-title">{text.ingredientsTitle}</h2>
                <p>{recipe.servings}</p>
              </div>
              {ingredientsPhoto && <figure className="r-ingredients__visual">
                <img className="r-ingredients__photo" src={ingredientsPhoto.url} alt={ingredientsPhoto.alt} width={ingredientsPhoto.width} height={ingredientsPhoto.height} loading="lazy" />
                {ingredientsPhoto.caption && <figcaption>{ingredientsPhoto.caption}</figcaption>}
              </figure>}
              <ul className="r-checklist">{recipe.ingredients.map((item, index) => (
                <li key={index}><label><input type="checkbox" name={`ingredient-${index}`} /><span>{item}</span></label></li>
              ))}</ul>
              {flavorPages[recipe.flavor] && <Link className="r-product-link" href={flavorPages[recipe.flavor]}>
                بسته‌بندی و مشخصات تن {recipe.flavorLabel} <span aria-hidden="true">↗</span>
              </Link>}
            </aside>
            <div className="r-method" id="method">
              <div className="r-method__heading">
                <p className="r-section-label">{text.methodLabel}</p><h2><HeadingText value={text.methodTitle} inline /></h2>
              </div>
              <ol className="r-steps">
                <li className="r-preparation"><span className="r-step-number">۰۱</span><div><h3>{text.preparationTitle}</h3><p>{recipe.preparation}</p></div></li>
                {recipe.steps.map((step, index) => (
                  <li key={index} data-recipe-reveal>
                    <span className="r-step-number">{faNumber(index + 2).padStart(2, '۰')}</span>
                    <div><h3>{step.title}</h3><p>{step.text}</p></div>
                  </li>
                ))}
              </ol>
              <aside className="r-tip"><span className="r-eyebrow">{text.tipLabel}</span><h3>{text.tipTitle}</h3><p>{recipe.tip}</p></aside>
            </div>
          </div>

          {gallery.length > 0 && <div className="r-recipe-gallery" data-recipe-reveal>
            {gallery.map(({ slot, photo, caption }) => <figure key={slot}>
              <img src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
              {caption && <figcaption>{caption}</figcaption>}
            </figure>)}
          </div>}
          {extraSections.length > 0 && <section className="r-extra-content" id="recipe-extra" aria-labelledby="recipe-extra-title">
            <h2 id="recipe-extra-title">{text.extraTitle}</h2>
            {extraSections.map((section, index) => <section key={index} data-recipe-reveal><h3>{section.title}</h3><p>{section.text}</p></section>)}
          </section>}

          <section className="r-nutrition" id="recipe-nutrition" aria-labelledby="recipe-nutrition-title">
            <BrandEdge id="recipe-nutrition-top" className="r-nutrition__edge" fillBelow />
            <BrandEdge id="recipe-nutrition-bottom" className="r-nutrition__edge r-nutrition__edge--bottom" fillBelow />
            <div>
              <p className="r-section-label">{text.nutritionLabel}</p>
              <h2 id="recipe-nutrition-title"><HeadingText value={text.nutritionTitle} /></h2>
              <p>{recipe.nutrition.serving}</p>
            </div>
            <div className="r-nutrition__values">
              <dl>{recipe.nutrition.rows.map((row, index) => <div key={index}><dt>{row.name}</dt><dd>{row.value}</dd></div>)}</dl>
              <p className="r-nutrition__note">{text.nutritionIntro} {recipe.nutrition.note} {text.nutritionOutro}</p>
            </div>
          </section>
          <section className="r-faq" id="recipe-questions" aria-labelledby="faq-title">
            <div><p className="r-section-label">{text.questionsLabel}</p><h2 id="faq-title"><HeadingText value={text.questionsTitle} /></h2></div>
            <div>{recipe.faq.map((item, index) => <details key={index}>
              <summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p>
            </details>)}</div>
          </section>
        </article>
        {related.length > 0 && <section className="r-related" aria-labelledby="related-title">
          <div className="r-related__head">
            <h2 id="related-title"><HeadingText value={text.relatedRecipesTitle} /></h2>
            <Link href="/recipes" className="r-text-link">همهٔ رسپی‌ها ←</Link>
          </div>
          <div className="r-grid" data-related-cards>
            {related.map(item => <div className="r-related-card" key={item.slug}>
              <div className="r-related-card__scroll"><RecipeCard recipe={toRecipeCard(item)} /></div>
            </div>)}
          </div>
        </section>}
        <ArticlesForRecipe slug={recipe.slug} selected={recipe.relatedArticleSlugs} label={text.relatedArticlesLabel} title={text.relatedArticlesTitle} />
      </main>
    </RecipeShell>
  );
}
