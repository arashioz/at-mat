import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articleCopy, resolvePageText } from '../../../../../backend/src/common/content-copy';
import { getArticle, getArticles, getArticleLogo, articleDate, siteOrigin } from '@/features/articles/data';
import { ArticleCard } from '@/features/articles/article-card';
import { ArticleText } from '@/features/articles/article-text';
import { ArticleReaderNav } from '@/features/articles/article-reader-nav';
import type { ArticlePhoto } from '@/features/articles/types';
import { RecipeShell } from '@/features/recipes/recipe-shell';
import { getPublishedRecipes, toRecipeCard } from '@/features/recipes/data';
import { RecipeCard } from '@/features/recipes/recipe-card';
import { inSelectionOrder } from '@/features/editorial/related';
import { flavors } from '@/features/products/catalog';
import { BrandEdge } from '@/features/brine/brand-edge';
import '@/features/articles/articles.css';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  return {
    title: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical: `${siteOrigin}/articles/${article.slug}` },
    openGraph: {
      type: 'article', locale: 'fa_IR', title: article.title, description: article.excerpt,
      publishedTime: article.publishedAt, modifiedTime: article.updatedAt,
      ...(article.cover ? { images: [{ url: new URL(article.cover.url, siteOrigin).href, width: 1536, height: 1024, alt: article.cover.alt }] } : {}),
    },
  };
}

function BodyPhoto({ photo, legacy = false }: { photo?: ArticlePhoto | null; legacy?: boolean }) {
  if (!photo) return null;
  const caption = photo.caption ?? (legacy ? `${photo.alt} · تصویرسازی` : '');
  return (
    <figure className="a-body-image">
      <img src={photo.url} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();
  const [logo, articles, publishedRecipes] = await Promise.all([
    getArticleLogo(), getArticles(), getPublishedRecipes().catch(() => []),
  ]);
  const text = resolvePageText(articleCopy, article.pageText);
  const related = inSelectionOrder(articles, article.relatedArticleSlugs);
  const recipes = inSelectionOrder(publishedRecipes, article.relatedRecipeSlugs);
  const products = inSelectionOrder(flavors, article.productSlugs);
  const bodyImageAfter = article.bodyImageAfter ?? article.sections[1]?.id;
  const canonical = `${siteOrigin}/articles/${article.slug}`;
  const schema = [
    {
      '@context': 'https://schema.org', '@type': 'Article', headline: article.title, description: article.excerpt,
      datePublished: article.publishedAt, dateModified: article.updatedAt, author: { '@type': 'Organization', name: article.author },
      publisher: { '@type': 'Organization', name: 'ات‌مت' }, mainEntityOfPage: canonical, wordCount: article.wordCount,
      inLanguage: 'fa-IR', articleSection: article.category,
      ...(article.cover ? { image: new URL(article.cover.url, siteOrigin).href } : {}),
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'ات‌مت', item: siteOrigin },
        { '@type': 'ListItem', position: 2, name: 'مقالات', item: `${siteOrigin}/articles` },
        { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
      ],
    },
  ];

  return (
    <RecipeShell logo={logo} section="articles">
      <main id="main-content" className="a-site" tabIndex={-1}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <article>
          <header className="a-detail-hero">
            <nav className="a-breadcrumb" aria-label="مسیر صفحه">
              <Link href="/articles">مجلهٔ ات‌مت</Link><span aria-hidden="true">/</span><span>{article.category}</span>
            </nav>
            <div className="a-detail-hero__layout">
              <div>
                <p className="a-eyebrow">{article.category}</p>
                <h1>{article.title}</h1>
                <p className="a-detail-excerpt">{article.excerpt}</p>
                <div className="a-detail-meta">
                  <span>{article.author}</span>
                  <time dateTime={article.publishedAt}>{articleDate(article.publishedAt)}</time>
                  <span>{article.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</span>
                  <span>{article.wordCount.toLocaleString('fa-IR')} کلمه</span>
                </div>
                <a className="a-link" href="#article-content">{text.startReading}</a>
              </div>
              {article.cover && <figure>
                <img src={article.cover.url} alt={article.cover.alt} width={article.cover.width} height={article.cover.height} fetchPriority="high" />
                {article.cover.caption && <figcaption className="a-cover-caption">{article.cover.caption}</figcaption>}
              </figure>}
            </div>
            <BrandEdge id={`article-edge-${slug}`} className="a-hero-edge" fillBelow />
          </header>

          <div className="a-reading-layout" id="article-content">
            <ArticleReaderNav sections={article.sections} questionsTitle={article.faq.length ? text.questionsTitle : undefined} sourcesTitle={text.sourcesTitle} />
            <div className="a-body" data-article-body>
              <div className="a-intro"><p><ArticleText text={article.intro} /></p></div>
              {article.takeaways.length > 0 && <section className="a-takeaways" aria-labelledby="takeaways-title">
                <p className="a-eyebrow">{text.takeawaysLabel}</p>
                <h2 id="takeaways-title">{text.takeawaysTitle}</h2>
                <ul>{article.takeaways.map((item, index) => <li key={index}>{item}</li>)}</ul>
              </section>}
              {!bodyImageAfter && <BodyPhoto photo={article.bodyImage} legacy />}
              {article.sections.map(section => (
                <section className="a-section" id={section.id} key={section.id}>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph, index) => <p key={index}><ArticleText text={paragraph} /></p>)}
                  {section.id === bodyImageAfter && <BodyPhoto photo={article.bodyImage} legacy />}
                  <BodyPhoto photo={section.image} />
                </section>
              ))}
              {article.faq.length > 0 && <section className="a-questions" id="article-faq">
                <h2>{text.questionsTitle}</h2>
                {article.faq.map((question, index) => <details key={index}>
                  <summary>{question.question}<span aria-hidden="true">+</span></summary>
                  <p><ArticleText text={question.answer} /></p>
                </details>)}
              </section>}
              <section className="a-sources" id="article-sources">
                <h2>{text.sourcesTitle}</h2>
                <ol>{article.sources.map((source, index) => (
                  <li key={index} id={`source-${index + 1}`}>
                    <a href={source.url} {...(source.url.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {source.title}
                    </a>
                  </li>
                ))}</ol>
                <p>{text.sourcesNote}</p>
                <p>آخرین ویرایش <time dateTime={article.updatedAt}>{articleDate(article.updatedAt)}</time></p>
              </section>
              <div className="a-tags" aria-label="موضوع‌های مقاله">{article.tags.map((tag, index) => <span key={index}>{tag}</span>)}</div>
              {products.length > 0 && <div className="a-product-links">
                <p>{text.productsTitle}</p>
                {products.map(product => <Link key={product.slug} href={`/flavors/${product.slug}`}>مشخصات تن ماهی {product.label}</Link>)}
              </div>}
            </div>
          </div>
        </article>
        {recipes.length > 0 && <section className="a-related-recipes">
          <div className="a-section-heading">
            <div><p className="a-eyebrow">{text.relatedRecipesLabel}</p><h2>{text.relatedRecipesTitle}</h2></div>
            <Link href="/recipes" className="a-link">همهٔ رسپی‌ها</Link>
          </div>
          <div className="r-grid">{recipes.map(recipe => <RecipeCard key={recipe.slug} recipe={toRecipeCard(recipe)} />)}</div>
        </section>}
        {related.length > 0 && <section className="a-related">
          <div className="a-section-heading">
            <h2>{text.relatedArticlesTitle}</h2><Link className="a-link" href="/articles">همهٔ مقاله‌ها</Link>
          </div>
          <div className="a-grid">{related.map(item => <ArticleCard key={item.slug} article={item} />)}</div>
        </section>}
      </main>
    </RecipeShell>
  );
}
