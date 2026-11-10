import { recipeCopy, recipeGalleryCaptions, resolvePageText } from '../../../backend/src/common/content-copy';
import { inSelectionOrder, relatedRecipesFor } from '../../../web/src/features/editorial/related';
import { mediaHref, SITE_URL } from '../../lib/media';
import type { RecipeArticleChoice, RecipeFields, RecipePhoto, RecipeSummary } from '../../lib/recipes';
import { CmsPreviewLinks } from '../CmsEditor';

function PreviewPhoto({ photo, defaultCaption = '' }: { photo?: RecipePhoto; defaultCaption?: string }) {
  if (!photo) return null;
  const caption = photo.caption ?? defaultCaption;
  return (
    <figure>
      <img className="recipe-preview__photo" src={mediaHref(photo.key)} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />
      {caption && <figcaption className="recipe-preview__caption">{caption}</figcaption>}
    </figure>
  );
}

export function RecipePreview({ draft, number, slug, recipes, articles }: {
  draft: RecipeFields; number?: string; slug: string; recipes: RecipeSummary[]; articles: RecipeArticleChoice[];
}) {
  const text = resolvePageText(recipeCopy, draft.pageText);
  const ingredients = draft.ingredients.filter(item => item.trim());
  const steps = draft.steps.filter(step => step.title.trim() || step.text.trim());
  const nutrition = draft.nutrition.rows.filter(row => row.name.trim() || row.value.trim());
  const faq = draft.faq.filter(item => item.question.trim() || item.answer.trim());
  const sections = draft.extraSections?.filter(item => item.title.trim() || item.text.trim()) ?? [];
  const gallerySlots = (Object.keys(recipeGalleryCaptions) as (keyof typeof recipeGalleryCaptions)[]).filter(slot => draft.photos[slot]);
  const related = relatedRecipesFor(recipes.filter(item => item.status === 'published'), slug, draft.category, draft.relatedRecipeSlugs);
  const publishedArticles = articles.filter(item => item.status === 'published');
  const relatedArticles = draft.relatedArticleSlugs
    ? inSelectionOrder(publishedArticles, draft.relatedArticleSlugs)
    : publishedArticles.filter(item => item.relatedRecipeSlugs?.includes(slug)).slice(0, 3);
  const facts = [
    { name: 'زمان تهیه', value: draft.duration },
    { name: 'تعداد وعده', value: draft.servings },
    { name: 'درجهٔ سختی', value: draft.difficulty },
  ].filter(item => item.value.trim());

  return (
    <article className="recipe-preview" aria-label="پیش‌نمایش محتوای رسپی">
      <header className={`recipe-preview__hero${draft.photos['cover-a'] ? ' recipe-preview__hero--photo' : ''}`}>
        <div>
          <p className="recipe-preview__kicker">
            {number && <span className="recipe-preview__number">{number}</span>}
            {draft.category || 'رسپی ات‌مت'}{draft.flavorLabel && ` · با تن ${draft.flavorLabel}`}
          </p>
          <h3>{draft.title || 'نام رسپی'}</h3>
          {draft.intro && <p className="recipe-preview__intro">{draft.intro}</p>}
          {facts.length > 0 && <dl className="recipe-preview__facts">{facts.map(fact => <div key={fact.name}><dt>{fact.name}</dt><dd>{fact.value}</dd></div>)}</dl>}
          {draft.timing && draft.timing !== draft.duration && <p className="recipe-preview__caption">{draft.timing}</p>}
          <a className="recipe-preview__jump" href="#recipe-preview-ingredients">{text.startCooking} <span aria-hidden="true">↓</span></a>
        </div>
        <PreviewPhoto photo={draft.photos['cover-a']} />
      </header>
      <div className="recipe-preview__body">
        <div className="recipe-preview__method">
          <section id="recipe-preview-ingredients">
            <p className="recipe-muted">{text.ingredientsLabel}</p>
            <h4>{text.ingredientsTitle}</h4>
            <PreviewPhoto photo={draft.photos.ingredients} />
            {ingredients.length > 0 ? (
              <ul className="recipe-preview__ingredients">{ingredients.map((ingredient, index) => <li key={index}>{ingredient}</li>)}</ul>
            ) : <p>مواد لازم هنوز وارد نشده است.</p>}
          </section>
          <section>
            <p className="recipe-muted">{text.methodLabel}</p>
            <h4>{text.methodTitle.replace(/\n/g, ' ')}</h4>
            {!draft.preparation && !steps.length && <p>مراحل پخت هنوز وارد نشده است.</p>}
            <ol className="recipe-preview__steps">
              {draft.preparation && <li><strong>{text.preparationTitle}</strong><p>{draft.preparation}</p></li>}
              {steps.map((step, index) => <li key={index}><strong>{step.title || 'عنوان مرحله'}</strong><p>{step.text}</p></li>)}
            </ol>
            {draft.tip && <aside className="recipe-preview__tip">
              <p className="recipe-muted">{text.tipLabel}</p><strong>{text.tipTitle}</strong><p>{draft.tip}</p>
            </aside>}
          </section>
        </div>
        {gallerySlots.length > 0 && <div className="recipe-preview__gallery">
          {gallerySlots.map(slot => <PreviewPhoto key={slot} photo={draft.photos[slot]} defaultCaption={recipeGalleryCaptions[slot]} />)}
        </div>}
        {sections.length > 0 && <section className="recipe-preview__extra">
          <h4>{text.extraTitle}</h4>
          {sections.map((section, index) => <section key={index}>
            <h5>{section.title || 'عنوان بخش'}</h5><p>{section.text}</p>
          </section>)}
        </section>}
        {(nutrition.length > 0 || draft.nutrition.serving || draft.nutrition.note) && <section className="recipe-preview__nutrition">
          <p>{text.nutritionLabel}</p>
          <h4>{text.nutritionTitle}</h4>
          {draft.nutrition.serving && <p>{draft.nutrition.serving}</p>}
          <dl>{nutrition.map((row, index) => <div key={index}><dt>{row.name}</dt><dd>{row.value}</dd></div>)}</dl>
          <p>{text.nutritionIntro} {draft.nutrition.note} {text.nutritionOutro}</p>
        </section>}
        {faq.length > 0 && <section className="recipe-preview__faq">
          <p className="recipe-muted">{text.questionsLabel}</p>
          <h4>{text.questionsTitle}</h4>
          {faq.map((item, index) => (
            <details key={index}>
              <summary>{item.question || 'پرسش'}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>}
        <CmsPreviewLinks title={text.relatedRecipesTitle} items={related} baseUrl={SITE_URL + '/recipes'} />
        <CmsPreviewLinks title={text.relatedArticlesTitle} label={text.relatedArticlesLabel} items={relatedArticles} baseUrl={SITE_URL + '/articles'} />
      </div>
    </article>
  );
}
