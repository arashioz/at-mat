import Link from 'next/link';
import { ArticleCard } from '@/features/articles/article-card';
import { getArticles } from '@/features/articles/data';
import { BrandEdge } from '@/features/brine/brand-edge';
import { flavors } from '@/features/products/catalog';
import { getFlavorMedia, getUploadedImage } from '@/features/products/media';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { getPublishedRecipes, toRecipeCard, type Recipe } from '@/features/recipes/data';
import { SiteFooter } from '@/features/site/site-footer';
import { SiteNavigation } from '@/features/site/site-navigation';
import { HomeHero } from './home-hero';
import '@/features/articles/articles.css';
import '@/features/recipes/recipes.css';
import './home.css';

const featuredRecipeSlugs = ['tuna-tomato-pasta', 'tuna-cucumber-salad', 'chili-tuna-corn-quesadilla'];

function selectRecipes(recipes: Recipe[]) {
  const featured = featuredRecipeSlugs.flatMap(slug => recipes.filter(recipe => recipe.slug === slug && recipe.photos['cover-a']));
  const ordered = [...featured, ...recipes.filter(recipe => recipe.photos['cover-a']), ...recipes];
  return [...new Map(ordered.map(recipe => [recipe.slug, recipe])).values()].slice(0, 3);
}

function SectionHeading({ id, label, title, description, link }: {
  id: string; label: string; title: string; description: string; link?: { href: string; label: string };
}) {
  return (
    <header className="home-section__head">
      <div>
        <p className="home-kicker">{label}</p>
        <h2 id={id}>{title}</h2>
        <p className="home-section__intro">{description}</p>
      </div>
      {link && <Link className="home-text-link" href={link.href}>{link.label}</Link>}
    </header>
  );
}

export async function HomeLanding({ staticMode }: { staticMode: boolean }) {
  const [products, coast, recipes, articles] = await Promise.all([
    Promise.all(flavors.map(async flavor => {
      const [media, artwork] = await Promise.all([
        getFlavorMedia(flavor.mediaPrefix),
        staticMode ? undefined : getUploadedImage(`atmat-showcase-${flavor.slug}-ink`, { width: 1040, height: 1040, alt: '' }),
      ]);
      return { ...flavor, media, artwork };
    })),
    getUploadedImage('atmat-home-shore-poster', { width: 1280, height: 720, alt: '' })
      .then(poster => poster ?? getUploadedImage('atmat-home-coast', { width: 1672, height: 941, alt: '' })),
    getPublishedRecipes().catch(() => []),
    getArticles().catch(() => []),
  ]);
  const brine = products[0];
  const { logo, ideas } = brine.media;
  const storyPhoto = ideas['brine-idea-sandwich'];
  const featuredRecipes = selectRecipes(recipes);
  const featuredArticles = [...articles.filter(article => article.cover), ...articles.filter(article => !article.cover)].slice(0, 3);

  return (
    <div className="home-page" data-still={staticMode || undefined}>
      <SiteNavigation logo={logo.url} section="home" />
      <main id="main-content" tabIndex={-1}>
        <HomeHero logo={logo} coast={coast} staticMode={staticMode} flavors={products.map(({ slug, label, copy, media, theme, artwork }) => ({
          slug, label, name: copy.name, headline: copy.headline, lid: media.lid, artwork, theme: { pale: theme.pale },
          netWeight: copy.netWeight,
          drainedWeight: copy.notes.find(note => note.unit === 'وزن آبکش')?.figure,
        }))} />

        <section className="home-story" id="brand-story" aria-labelledby="home-story-title">
          <div className="home-wrap home-story__layout">
            <div className="home-story__copy">
              <p className="home-kicker">داستان ات‌مت</p>
              <h2 id="home-story-title">هر سفره،<br /><span>مزهٔ خودش را دارد.</span></h2>
              <p>از ساندویچ ناهار تا پاستای شب دورهمی، هر غذا چاشنی خودش را می‌خواهد. تن ماهی ات‌مت در ایران و در شش طعم تولید می‌شود؛ طعمی را بردار که به غذای امروزت می‌آید.</p>
              <Link className="home-text-link" href="/about">با ات‌مت آشنا شو</Link>
            </div>
            <figure className="home-story__image">
              <div className="home-story__frame">
                <img src={storyPhoto.url} alt="ساندویچ تن ماهی، پیشنهاد سرو ات‌مت" width={storyPhoto.width} height={storyPhoto.height} loading="lazy" decoding="async" />
              </div>
            </figure>
          </div>
        </section>

        <section className="home-kitchen home-section" aria-labelledby="home-recipes-title">
          <BrandEdge id="home-kitchen-edge" className="home-kitchen__edge" fillBelow />
          <div className="home-wrap">
            <SectionHeading id="home-recipes-title" label="آشپزخانهٔ ات‌مت" title="باهاش چی بپزیم؟"
              description="برای ناهارِ وسط هفته یا شام دورهمی، یک دستور پیدا کن و از همان‌جا شروع کن."
              link={{ href: '/recipes', label: 'همهٔ رسپی‌ها' }} />
            {featuredRecipes.length > 0 && <div className="home-kitchen__grid">
              {featuredRecipes.map(recipe => <RecipeCard key={recipe.slug} recipe={toRecipeCard(recipe)} />)}
            </div>}
          </div>
        </section>

        <section className="home-wrap home-journal home-section" aria-labelledby="home-articles-title">
          <SectionHeading id="home-articles-title" label="مجلهٔ ات‌مت" title="قبل از باز کردن قوطی."
            description="از خواندن برچسب تا انتخاب طعم و نگهداری کنسرو، جواب سؤال‌های رایج را در مجله بخوان."
            link={{ href: '/articles', label: 'همهٔ مقاله‌ها' }} />
          {featuredArticles.length > 0 && <div className="home-journal__grid">
            {featuredArticles.map(article => <ArticleCard key={article.slug} article={article} />)}
          </div>}
        </section>
      </main>
      <SiteFooter logo={logo.url} headline={['به سلیقهٔ تو.']} />
    </div>
  );
}
