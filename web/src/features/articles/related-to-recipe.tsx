import { getArticles } from './data';
import { ArticleCard } from './article-card';
import Link from 'next/link';
import { inSelectionOrder } from '../editorial/related';
import './articles.css';
/** Optional magazine discovery must not stop a recipe from rendering. */
export async function ArticlesForRecipe({ slug, selected, label, title }: {
  slug: string;
  selected?: string[];
  label: string;
  title: string;
}) {
  if (selected?.length === 0) return null;
  const articles = await getArticles().catch(() => []);
  const related = selected
    ? inSelectionOrder(articles, selected)
    : articles.filter(article => article.relatedRecipeSlugs.includes(slug)).slice(0, 3);
  if (!related.length) return null;
  return (
    <section className="a-site a-related" aria-labelledby="recipe-articles-title">
      <div className="a-section-heading">
        <div><p className="a-eyebrow">{label}</p><h2 id="recipe-articles-title">{title}</h2></div>
        <Link href="/articles" className="a-link">همهٔ مقاله‌ها</Link>
      </div>
      <div className="a-grid">{related.map(article => <ArticleCard key={article.slug} article={article} />)}</div>
    </section>
  );
}
