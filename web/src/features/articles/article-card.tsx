import Link from 'next/link';
import type { ArticleCardData } from './types';
export function ArticleCard({ article }: { article: ArticleCardData }) {
  return <article className="a-card">
    <Link className="a-card__image" href={`/articles/${article.slug}`} tabIndex={-1} aria-hidden="true">{article.cover && <img src={article.cover.url} alt="" width={article.cover.width} height={article.cover.height} loading="lazy" />}</Link>
    <div className="a-card__copy"><div className="a-card__meta"><span>{article.category}</span><span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</span></div>
    <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3><p>{article.excerpt}</p><Link className="a-card__read" href={`/articles/${article.slug}`} aria-label={`خواندن ${article.title}`}>بخونیم</Link></div>
  </article>;
}
