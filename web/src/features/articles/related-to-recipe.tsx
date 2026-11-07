import { getArticles } from './data';
import { ArticleCard } from './article-card';
import Link from 'next/link';
import './articles.css';
/** Optional magazine discovery must not stop a recipe from rendering. */
export async function ArticlesForRecipe({ slug }: { slug: string }) {
  const articles = await getArticles().catch(() => []);
  const related = articles.filter(a => a.relatedRecipeSlugs.includes(slug)).slice(0, 3);
  if (!related.length) return null;
  return <section className="a-site a-related" aria-labelledby="recipe-articles-title"><div className="a-section-heading"><div><p className="a-eyebrow">کنار آشپزی، بیشتر بدونیم</p><h2 id="recipe-articles-title">از مجلهٔ ات‌مت.</h2></div><Link href="/articles" className="a-link">همهٔ مقاله‌ها ←</Link></div><div className="a-grid">{related.map(a => <ArticleCard key={a.slug} article={a} />)}</div></section>;
}
