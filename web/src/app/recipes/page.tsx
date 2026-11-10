import type { Metadata } from 'next';
import Link from 'next/link';
import { getRecipeAssets, getRecipeLogo, toRecipeCard } from '@/features/recipes/data';
import { RecipeShell } from '@/features/recipes/recipe-shell';
import { RecipeBrowser } from '@/features/recipes/recipe-browser';
import { BrandEdge } from '@/features/brine/brand-edge';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const logo = await getRecipeLogo();
  return { title: 'آشپزخانهٔ ات‌مت؛ رسپی‌ها', description: 'ایده‌هایی برای آشپزی با تن ماهی ات‌مت؛ مواد لازم، مراحل تهیه و نکته‌های سرو.', icons: { icon: logo }, alternates: { canonical: '/recipes' } };
}

export default async function RecipesPage() {
  const { recipes, logo } = await getRecipeAssets();
  const featured = recipes.find(recipe => recipe.id === 3 && recipe.photos['cover-a']) ?? recipes.find(recipe => recipe.photos['cover-a']);
  const cover = featured?.photos['cover-a'];
  return (
    <RecipeShell logo={logo}>
      <main id="main-content" tabIndex={-1}>
        <section className="r-index-hero">
          <div className="r-index-hero__copy">
            <h1><span className="r-mask"><span data-recipe-line>باهاش</span></span><span className="r-mask"><span data-recipe-line>چی بپزیم؟</span></span></h1>
            <p className="r-index-hero__intro">از یک قوطی، به کلی مزه برس.<br />ایده‌هایی برای هر روز، با سلیقهٔ خودت.</p>
            <a className="r-hero-cta" href="#recipe-library">رسپیِ امروزت رو پیدا کن</a>
          </div>
          {featured && cover && <div className="r-hero-composition" data-recipe-photo>
            <Link className="r-featured-recipe" href={`/recipes/${featured.slug}`} aria-label={featured.title}>
              <img src={cover.url} alt={cover.alt} width={cover.width} height={cover.height} fetchPriority="high" />
              <div className="r-featured-recipe__caption"><span>پیشنهاد امروز · {featured.duration}</span><h2>{featured.title}</h2><span className="r-featured-recipe__read">دیدن دستور <span aria-hidden="true">←</span></span></div>
            </Link>
          </div>}
          <BrandEdge id="recipe-index-edge" className="r-index-hero__edge" fillBelow />
        </section>
        <RecipeBrowser recipes={recipes.map(toRecipeCard)} />
      </main>
    </RecipeShell>
  );
}
