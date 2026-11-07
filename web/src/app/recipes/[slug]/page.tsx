import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRecipeAssets, toRecipeCard, flavorPages, faNumber } from '@/features/recipes/data';
import { RecipeShell } from '@/features/recipes/recipe-shell';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { RecipeClockIcon, RecipeServingsIcon, RecipeDifficultyIcon, RecipeDownIcon } from '@/features/recipes/recipe-icons';
import { BrandEdge } from '@/features/brine/brand-edge';
import { RecipeSectionNav } from '@/features/recipes/recipe-section-nav';
import { ArticlesForRecipe } from '@/features/articles/related-to-recipe';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { recipes, logo } = await getRecipeAssets();
  const { slug } = await params;
  const recipe = recipes.find(item => item.slug === slug);
  if (!recipe) notFound();
  return { title: recipe.seoTitle, description: recipe.metaDescription, icons: { icon: logo }, alternates: { canonical: `/recipes/${recipe.slug}` } };
}

export default async function RecipePage({ params }: Props) {
  const { recipes, logo } = await getRecipeAssets();
  const { slug } = await params;
  const recipe = recipes.find(item => item.slug === slug);
  if (!recipe) notFound();
  const cover = recipe.photos['cover-a'];
  const ingredientsPhoto = recipe.photos.ingredients;
  const keyPhoto = recipe.photos['key-step'];
  const servingPhoto = recipe.photos['serving-detail'];
  const related = [...recipes.filter(item => item.slug !== slug && item.category === recipe.category), ...recipes.filter(item => item.slug !== slug && item.category !== recipe.category)].slice(0, 3);
  return (
    <RecipeShell logo={logo} flavor={recipe.flavor}>
      <main id="main-content" tabIndex={-1}>
        <article key={recipe.slug}>
          <header className={`r-detail-hero${cover ? '' : ' r-detail-hero--text'}`}>
            <nav className="r-breadcrumb" aria-label="مسیر صفحه"><Link href="/recipes">رسپی‌ها</Link><span aria-hidden="true">/</span><span>{recipe.category}</span></nav>
            <div className="r-detail-hero__layout"><div className="r-detail-hero__copy">
              <p className="r-kicker"><b>{recipe.number}</b>با تن {recipe.flavorLabel}</p>
              <h1><span className="r-mask"><span data-recipe-line>{recipe.title}</span></span></h1>
              <p className="r-detail-hero__intro">{recipe.intro}</p>
              <div className="r-detail-meta"><dl>
                <div><dt><RecipeClockIcon /><span>زمان تهیه</span></dt><dd>{recipe.duration}</dd></div>
                <div><dt><RecipeServingsIcon /><span>برای</span></dt><dd>{recipe.servings}</dd></div>
                <div><dt><RecipeDifficultyIcon /><span>درجهٔ سختی</span></dt><dd>{recipe.difficulty}</dd></div>
              </dl></div>
              <div className="r-detail-actions"><a className="r-hero-cta" href="#ingredients-title">بریم سراغ مواد <span><RecipeDownIcon /></span></a></div>
            </div>
            {cover && <div className="r-detail-hero__visual" data-recipe-photo><figure className="r-detail-cover"><img src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} fetchPriority="high" /></figure></div>}</div>
            <BrandEdge id="recipe-method-edge" className="r-detail-hero__edge" fillBelow />
          </header>

          <RecipeSectionNav />
          <div className="r-cook-layout">
            <aside className="r-ingredients" id="ingredients" aria-labelledby="ingredients-title">
              <div className="r-ingredients__heading"><p className="r-section-label">مواد لازم</p><h2 id="ingredients-title">چی لازم داریم؟</h2><p>{recipe.servings}</p></div>
              {ingredientsPhoto && <img className="r-ingredients__photo" src={ingredientsPhoto.url} alt={ingredientsPhoto.alt} width={ingredientsPhoto.width} height={ingredientsPhoto.height} loading="lazy" />}
              <ul className="r-checklist">{recipe.ingredients.map((item, index) => <li key={item}><label><input type="checkbox" name={`ingredient-${index}`} /><span>{item}</span></label></li>)}</ul>
              {flavorPages[recipe.flavor] && <Link className="r-product-link" href={flavorPages[recipe.flavor]}>بسته‌بندی و مشخصات تن {recipe.flavorLabel} <span aria-hidden="true">↗</span></Link>}
            </aside>

            <div className="r-method" id="method">
              <div className="r-method__heading"><p className="r-section-label">طرز تهیه</p><h2>دست‌به‌کار <span>شویم.</span></h2></div>
              <ol className="r-steps">
                <li className="r-preparation"><span className="r-step-number">۰۱</span><div><h3>اول، آماده‌سازی تن</h3><p>{recipe.preparation}</p></div></li>
                {recipe.steps.map((step, index) => <li key={step.title} data-recipe-reveal><span className="r-step-number">{faNumber(index + 2).padStart(2, '۰')}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}
              </ol>
              <aside className="r-tip"><span className="r-eyebrow">فوت آخر</span><h3>برای خوش‌مزه‌تر شدن.</h3><p>{recipe.tip}</p></aside>
            </div>
          </div>

          {(keyPhoto || servingPhoto) && <div className="r-recipe-gallery" data-recipe-reveal>{keyPhoto && <figure><img src={keyPhoto.url} alt={keyPhoto.alt} width={keyPhoto.width} height={keyPhoto.height} loading="lazy" /><figcaption>در آشپزخانه</figcaption></figure>}{servingPhoto && <figure><img src={servingPhoto.url} alt={servingPhoto.alt} width={servingPhoto.width} height={servingPhoto.height} loading="lazy" /><figcaption>آمادهٔ سرو</figcaption></figure>}</div>}

          <section className="r-nutrition" id="recipe-nutrition" aria-labelledby="recipe-nutrition-title"><BrandEdge id="recipe-nutrition-top" className="r-nutrition__edge" fillBelow /><BrandEdge id="recipe-nutrition-bottom" className="r-nutrition__edge r-nutrition__edge--bottom" fillBelow /><div><p className="r-section-label">در هر وعده</p><h2 id="recipe-nutrition-title">ارزش غذایی،<br />در یک نگاه.</h2><p>{recipe.nutrition.serving}</p></div><div className="r-nutrition__values"><dl>{recipe.nutrition.rows.map(row => <div key={row.name}><dt>{row.name}</dt><dd>{row.value}</dd></div>)}</dl><p className="r-nutrition__note">این مقادیر تخمینی‌اند. {recipe.nutrition.note} مقدار واقعی با برند مواد و روغن باقی‌مانده تغییر می‌کند.</p></div></section>

          <section className="r-faq" id="recipe-questions" aria-labelledby="faq-title"><div><p className="r-section-label">پرسش‌های متداول</p><h2 id="faq-title">قبل از<br /><span>اولین لقمه.</span></h2></div><div>{recipe.faq.map(item => <details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></section>
        </article>

        <section className="r-related" aria-labelledby="related-title"><div className="r-related__head"><h2 id="related-title">دفعهٔ بعد،<br /><span>این‌ها را امتحان کن.</span></h2><Link href="/recipes" className="r-text-link">همهٔ رسپی‌ها ←</Link></div><div className="r-grid" data-related-cards>{related.map(item => <div className="r-related-card" key={item.slug}><div className="r-related-card__scroll"><RecipeCard recipe={toRecipeCard(item)} /></div></div>)}</div></section>
        <ArticlesForRecipe slug={recipe.slug} />
      </main>
    </RecipeShell>
  );
}
