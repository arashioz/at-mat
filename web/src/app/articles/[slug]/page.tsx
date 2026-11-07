import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticle, getArticles, getArticleLogo, articleDate, siteOrigin } from '@/features/articles/data';
import { ArticleCard } from '@/features/articles/article-card';
import { ArticleText } from '@/features/articles/article-text';
import { ArticleReaderNav } from '@/features/articles/article-reader-nav';
import { RecipeShell } from '@/features/recipes/recipe-shell';
import { getRecipeAssets, toRecipeCard } from '@/features/recipes/data';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { flavors } from '@/features/products/catalog';
import { BrandEdge } from '@/features/brine/brand-edge';
import '@/features/articles/articles.css';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const article = await getArticle(slug); if (!article) notFound();
  return { title: article.seoTitle || article.title, description: article.metaDescription || article.excerpt, alternates: { canonical: `${siteOrigin}/articles/${article.slug}` }, openGraph: { type: 'article', locale: 'fa_IR', title: article.title, description: article.excerpt, publishedTime: article.publishedAt, modifiedTime: article.updatedAt, ...(article.cover ? { images: [{ url: new URL(article.cover.url, siteOrigin).href, width: 1536, height: 1024, alt: article.cover.alt }] } : {}) } };
}
export default async function ArticlePage({ params }: Props) {
  const { slug } = await params; const article = await getArticle(slug); if (!article) notFound();
  const [logo, articles, recipeAssets] = await Promise.all([getArticleLogo(), getArticles(), getRecipeAssets()]);
  const related = articles.filter(a => article.relatedArticleSlugs.includes(a.slug));
  const recipes = recipeAssets.recipes.filter(r => article.relatedRecipeSlugs.includes(r.slug));
  const canonical = `${siteOrigin}/articles/${article.slug}`;
  const schema = [{ '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.excerpt, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { '@type': 'Organization', name: article.author }, publisher: { '@type': 'Organization', name: 'ات‌مت' }, mainEntityOfPage: canonical, wordCount: article.wordCount, inLanguage: 'fa-IR', articleSection: article.category, ...(article.cover ? { image: new URL(article.cover.url, siteOrigin).href } : {}) }, { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'ات‌مت', item: siteOrigin }, { '@type': 'ListItem', position: 2, name: 'مقالات', item: `${siteOrigin}/articles` }, { '@type': 'ListItem', position: 3, name: article.title, item: canonical }] }];
  return <RecipeShell logo={logo} section="articles"><main id="main-content" className="a-site" tabIndex={-1}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    <article><header className="a-detail-hero"><nav className="a-breadcrumb" aria-label="مسیر صفحه"><Link href="/articles">مجلهٔ ات‌مت</Link><span aria-hidden="true">/</span><span>{article.category}</span></nav><div className="a-detail-hero__layout"><div><p className="a-eyebrow">{article.category}</p><h1>{article.title}</h1><p className="a-detail-excerpt">{article.excerpt}</p><div className="a-detail-meta"><span>{article.author}</span><time dateTime={article.publishedAt}>{articleDate(article.publishedAt)}</time><span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</span><span>{article.wordCount.toLocaleString('fa-IR')} کلمه</span></div><a className="a-link" href="#article-content">شروع خوندن <span aria-hidden="true">↓</span></a></div>{article.cover && <figure><img src={article.cover.url} alt={article.cover.alt} width={1536} height={1024} fetchPriority="high" /></figure>}</div><BrandEdge id={`article-edge-${slug}`} className="a-hero-edge" fillBelow /></header>
    <div className="a-reading-layout" id="article-content"><ArticleReaderNav sections={article.sections} /><div className="a-body" data-article-body>
      <div className="a-intro"><p><ArticleText text={article.intro} /></p></div>
      {article.takeaways.length > 0 && <section className="a-takeaways" aria-labelledby="takeaways-title"><p className="a-eyebrow">پیش از شروع</p><h2 id="takeaways-title">چیزهایی که می‌دونیم.</h2><ul>{article.takeaways.map(t => <li key={t}>{t}</li>)}</ul></section>}
      {article.sections.map((section, index) => <section className="a-section" id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((p, i) => <p key={i}><ArticleText text={p} /></p>)}{index === 1 && article.bodyImage && <figure className="a-body-image"><img src={article.bodyImage.url} alt={article.bodyImage.alt} width={1536} height={1024} loading="lazy" /><figcaption>{article.bodyImage.alt} · تصویرسازی</figcaption></figure>}</section>)}
      <section className="a-questions" id="article-faq"><h2>پرسش‌های رایج</h2>{article.faq.map(q => <details key={q.question}><summary>{q.question}<span aria-hidden="true">+</span></summary><p><ArticleText text={q.answer} /></p></details>)}</section>
      <section className="a-sources" id="article-sources"><h2>منابع این مقاله</h2><ol>{article.sources.map((source, i) => <li key={i} id={`source-${i + 1}`}><a href={source.url} {...(source.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{source.title} <span aria-hidden="true">↗</span></a></li>)}</ol><p>محتوای آموزشی عمومی است. برای برنامه غذایی یا شرایط پزشکی فردی، از متخصص راهنمایی بگیرید. تصاویر، تصویرسازی‌اند و مستندات تولید یا تأمین ات‌مت نیستند.</p><p>آخرین ویرایش <time dateTime={article.updatedAt}>{articleDate(article.updatedAt)}</time></p></section>
      <div className="a-tags" aria-label="موضوع‌های مقاله">{article.tags.map(t => <span key={t}>{t}</span>)}</div>
      {article.productSlugs.length > 0 && <div className="a-product-links"><p>از روی بسته بخونیم</p>{flavors.filter(f => article.productSlugs.includes(f.slug)).map(f => <Link key={f.slug} href={`/flavors/${f.slug}`}>مشخصات تن ماهی {f.label} <span aria-hidden="true">↗</span></Link>)}</div>}
    </div></div></article>
    {recipes.length > 0 && <section className="a-related-recipes"><div className="a-section-heading"><div><p className="a-eyebrow">یک قدم تا سفره</p><h2>باهاش چی بپزیم؟</h2></div><Link href="/recipes" className="a-link">همهٔ رسپی‌ها ←</Link></div><div className="r-grid">{recipes.map(r => <RecipeCard key={r.slug} recipe={toRecipeCard(r)} />)}</div></section>}
    {related.length > 0 && <section className="a-related"><div className="a-section-heading"><h2>ادامهٔ این ماجرا.</h2><Link className="a-link" href="/articles">همهٔ مقاله‌ها ←</Link></div><div className="a-grid">{related.map(a => <ArticleCard key={a.slug} article={a} />)}</div></section>}
  </main></RecipeShell>;
}
