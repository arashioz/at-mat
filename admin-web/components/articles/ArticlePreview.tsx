import { parseArticleText } from '../../../web/src/features/articles/parse-article-text';
import { BrandEdge } from '../../../web/src/features/brine/brand-edge';
import { articleCopy, resolvePageText } from '../../../backend/src/common/content-copy';
import { inSelectionOrder } from '../../../web/src/features/editorial/related';
import '../../../web/src/features/articles/articles.css';
import { type ArticleFields, type ArticlePhoto, type ArticleSummary, type RecipeChoice, formatNumber, productChoices, siteOrigin } from '../../lib/articles';
import { mediaHref } from '../../lib/media';
import { CmsPreviewLinks } from '../CmsEditor';

function sourceHref(url: string) {
  if (/^\/flavors\/[a-z0-9-]+(?:#[a-z0-9-]+)?$/.test(url)) return siteOrigin + url;
  if (/^https?:\/\/[^\s]+$/.test(url)) return url;
}

function PreviewText({ text }: { text: string }) {
  return <>{parseArticleText(text).map((part, index) => {
    if (part.type === 'link') return <a key={index} href={siteOrigin + part.href} target="_blank" rel="noreferrer">{part.label}</a>;
    if (part.type === 'citations') return (
      <sup className="a-citation" key={index}>
        {part.entries.map(({ label, source }, entryIndex) => (
          <a key={entryIndex} href={'#source-' + source} aria-label={'منبع ' + label}>[{label}]</a>
        ))}
      </sup>
    );
    return part.value;
  })}</>;
}

function BodyPhoto({ photo, legacy = false }: { photo?: ArticlePhoto | null; legacy?: boolean }) {
  if (!photo) return null;
  const caption = photo.caption ?? (legacy ? `${photo.alt} · تصویرسازی` : '');
  return (
    <figure className="a-body-image">
      <img src={mediaHref(photo.key)} alt={photo.alt} width={1536} height={1024} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function ArticlePreview({ fields, words, articles, recipes }: {
  fields: ArticleFields; words: number; articles: ArticleSummary[]; recipes: RecipeChoice[];
}) {
  const text = resolvePageText(articleCopy, fields.pageText);
  const related = inSelectionOrder(articles.filter(item => item.status === 'published'), fields.relatedArticleSlugs);
  const relatedRecipes = inSelectionOrder(recipes.filter(item => item.status === 'published'), fields.relatedRecipeSlugs);
  const products = inSelectionOrder(productChoices, fields.productSlugs);
  const bodyPhoto = <BodyPhoto photo={fields.bodyImage} legacy />;
  const bodyImageAfter = fields.bodyImageAfter ?? fields.sections[1]?.id;
  return (
    <article className="a-site article-preview" aria-label="پیش‌نمایش مقاله">
      <header className="a-detail-hero">
        <p className="a-breadcrumb">مجلهٔ ات‌مت <span aria-hidden="true">/</span> {fields.category}</p>
        <div className="a-detail-hero__layout">
          <div>
            <p className="a-eyebrow">{fields.category}</p>
            <h1>{fields.title || 'عنوان مقاله'}</h1>
            {fields.excerpt && <p className="a-detail-excerpt">{fields.excerpt}</p>}
            <div className="a-detail-meta">
              <span>{fields.author || 'تحریریهٔ ات‌مت'}</span>
              <span>{formatNumber(Math.max(1, Math.ceil(words / 190)))} دقیقه مطالعه</span>
              <span>{formatNumber(words)} کلمه</span>
            </div>
            <a className="a-link" href="#article-preview-content">{text.startReading} <span aria-hidden="true">↓</span></a>
          </div>
          {fields.cover && (
            <figure>
              <img src={mediaHref(fields.cover.key)} alt={fields.cover.alt} width={1536} height={1024} />
              {fields.cover.caption && <figcaption className="a-cover-caption">{fields.cover.caption}</figcaption>}
            </figure>
          )}
        </div>
        <BrandEdge id="cms-magazine-preview-edge" className="a-hero-edge" fillBelow />
      </header>

      <div className="a-body" id="article-preview-content">
        {fields.intro && <div className="a-intro"><p><PreviewText text={fields.intro} /></p></div>}
        {!!fields.takeaways.filter(Boolean).length && (
          <section className="a-takeaways">
            <p className="a-eyebrow">{text.takeawaysLabel}</p>
            <h2>{text.takeawaysTitle}</h2>
            <ul>{fields.takeaways.filter(Boolean).map((item, index) => <li key={index}>{item}</li>)}</ul>
          </section>
        )}
        {!bodyImageAfter && bodyPhoto}
        {fields.sections.map((section, index) => (
          <section className="a-section" key={index}>
            <h2>{section.title || 'عنوان بخش'}</h2>
            {section.paragraphs.filter(Boolean).map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}><PreviewText text={paragraph} /></p>
            ))}
            {bodyImageAfter && bodyImageAfter === section.id && bodyPhoto}
            <BodyPhoto photo={section.image} />
          </section>
        ))}
        {!!fields.faq.length && (
          <section className="a-questions">
            <h2>{text.questionsTitle}</h2>
            {fields.faq.map((item, index) => (
              <details key={index}>
                <summary>{item.question || 'پرسش'} <span aria-hidden="true">+</span></summary>
                <p><PreviewText text={item.answer} /></p>
              </details>
            ))}
          </section>
        )}
        {!!fields.sources.length && (
          <section className="a-sources">
            <h2>{text.sourcesTitle}</h2>
            <ol>{fields.sources.map((source, index) => {
              const href = sourceHref(source.url);
              const name = source.title || 'منبع';
              return (
                <li key={index} id={'source-' + (index + 1)}>
                  {href ? <a href={href} target="_blank" rel="noreferrer">{name}</a> : name}
                </li>
              );
            })}</ol>
            <p>{text.sourcesNote}</p>
          </section>
        )}
        <CmsPreviewLinks title={text.productsTitle} items={products} baseUrl={siteOrigin + '/flavors'} />
        <CmsPreviewLinks title={text.relatedRecipesTitle} label={text.relatedRecipesLabel} items={relatedRecipes} baseUrl={siteOrigin + '/recipes'} />
        <CmsPreviewLinks title={text.relatedArticlesTitle} items={related} baseUrl={siteOrigin + '/articles'} />
        {!!fields.tags.filter(Boolean).length && (
          <div className="a-tags" aria-label="موضوع‌های مقاله">
            {fields.tags.filter(Boolean).map((tag, index) => <span key={index}>{tag}</span>)}
          </div>
        )}
      </div>
    </article>
  );
}
