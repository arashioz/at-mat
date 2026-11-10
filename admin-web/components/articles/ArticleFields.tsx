import { useState, type ReactNode } from 'react';
import { AdminIcon } from '../AdminIcon';
import { CmsMediaPicker } from '../CmsMediaPicker';
import { CmsRelations, CmsTextSettings } from '../CmsEditor';
import { CmsRows } from '../CmsRows';
import { articleCopy } from '../../../backend/src/common/content-copy';
import {
  articleCategories, formatNumber, productChoices, siteOrigin,
  type ArticleFields as Fields, type ArticleMediaTarget, type ArticlePhoto, type ArticleSection, type ArticleSummary, type RecipeChoice,
} from '../../lib/articles';
import { MEDIA_ACCEPT, mediaHref } from '../../lib/media';

type Change = <K extends keyof Fields>(key: K, value: Fields[K]) => void;
type EditorProps = { fields: Fields; change: Change };
type UploadImage = (slot: ArticleMediaTarget, file: File) => void;

export function ArticleField({ label, value, onChange, maxLength, rows, dir, hint, placeholder, readOnly }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  rows?: number;
  dir?: 'ltr' | 'rtl';
  hint?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const props = { className: 'admin-input', value, maxLength, dir, readOnly, placeholder };
  return (
    <label className="admin-field">
      <span>{label}</span>
      {rows
        ? <textarea {...props} rows={rows} onChange={event => onChange(event.target.value)} />
        : <input {...props} onChange={event => onChange(event.target.value)} />}
      {hint && <small className="article-field-hint">{hint}</small>}
    </label>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="admin-panel article-edit-panel">
      <div className="article-panel-heading">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  );
}

function editRow<T>(rows: T[], index: number, row: T) {
  return rows.map((value, i) => i === index ? row : value);
}

export function ArticleDetails({ fields, change, lockedSlug, isNew }: EditorProps & { lockedSlug: boolean; isNew: boolean }) {
  return (
    <Panel title="مشخصات مقاله" description="عنوان، خلاصه و دسته‌بندی در کارت مقاله و صفحهٔ مجله دیده می‌شوند.">
      <ArticleField label="عنوان مقاله" maxLength={200} value={fields.title} onChange={value => change('title', value)} placeholder="عنوانی روشن و مشخص" />
      <div className="article-field-pair">
        <ArticleField label="نشانی مقاله" maxLength={90} value={fields.slug} onChange={value => change('slug', value)} dir="ltr"
          placeholder="article-slug" readOnly={lockedSlug}
          hint={lockedSlug ? 'نشانی پس از اولین انتشار ثابت است.'
            : isNew ? 'اختیاری. اگر خالی بماند، خودکار ساخته می‌شود.'
            : 'حروف کوچک انگلیسی، عدد و خط تیره'} />
        <label className="admin-field">
          <span>دسته‌بندی</span>
          <select className="admin-input" value={fields.category} onChange={event => change('category', event.target.value)}>
            {articleCategories.map(category => <option key={category}>{category}</option>)}
          </select>
        </label>
      </div>
      <ArticleField label="خلاصهٔ کارت" value={fields.excerpt} onChange={value => change('excerpt', value)} rows={3}
        maxLength={400} hint={formatNumber(fields.excerpt.length) + ' از ۴۰۰ نویسه'} />
      <div className="article-field-pair">
        <ArticleField label="نویسنده" maxLength={100} value={fields.author} onChange={value => change('author', value)} />
        <ArticleField label="برچسب‌ها" value={fields.tags.join('\n')} onChange={value => change('tags', value.split('\n'))}
          rows={3} hint="حداکثر ۱۰ برچسب، هر مورد در یک خط" />
      </div>
      <CmsTextSettings defaults={articleCopy} overrides={fields.pageText} onChange={value => change('pageText', value)}
        fields={[{ key: 'startReading', label: 'دکمهٔ شروع مطالعه' }]} />
    </Panel>
  );
}

export function ArticleIntro({ fields, change }: EditorProps) {
  return (
    <Panel title="مقدمه و نکته‌های کلیدی" description="این قسمت پیش از بخش‌های اصلی مقاله نمایش داده می‌شود.">
      <ArticleField label="مقدمه" maxLength={7000} value={fields.intro} onChange={value => change('intro', value)} rows={5} />
      <ArticleField label="نکته‌های کلیدی" value={fields.takeaways.join('\n')} onChange={value => change('takeaways', value.split('\n'))}
        rows={3} hint="حداکثر ۵ نکته، هر مورد در یک خط" />
      <CmsTextSettings defaults={articleCopy} overrides={fields.pageText} onChange={value => change('pageText', value)}
        fields={[{ key: 'takeawaysLabel', label: 'روتیتر نکته‌ها' }, { key: 'takeawaysTitle', label: 'عنوان نکته‌ها' }]} />
    </Panel>
  );
}

export function ArticleBody({ fields, change, onUpload }: EditorProps & { onUpload: UploadImage }) {
  function newSection(): ArticleSection {
    const used = new Set(fields.sections.map(section => section.id));
    let number = fields.sections.length + 1;
    while (used.has('section-' + number)) number += 1;
    return { id: 'section-' + number, title: '', paragraphs: [''] };
  }

  return (
    <Panel title="بدنهٔ مقاله" description="برای ویرایش عنوان و پاراگراف‌ها، بخش موردنظر را باز کنید.">
      <CmsRows title="بخش‌های مقاله" itemLabel="بخش" addLabel="افزودن بخش"
        items={fields.sections} limit={20} makeItem={newSection} summary={section => section.title}
        onChange={sections => change('sections', sections)}
        onRemove={section => {
          if (fields.bodyImageAfter === section.id) change('bodyImageAfter', '');
        }}
        fields={(section, setSection, sectionIndex) => <>
          <div className="article-field-pair">
            <ArticleField label="عنوان بخش" maxLength={180} value={section.title} onChange={title => setSection({ ...section, title })} />
            <ArticleField label="شناسهٔ بخش" maxLength={90} dir="ltr" value={section.id} hint="بخش انتهایی پیوند به این عنوان"
              onChange={id => {
                setSection({ ...section, id });
                if (fields.bodyImageAfter === section.id) change('bodyImageAfter', id);
              }} />
          </div>
          <CmsRows title="پاراگراف‌ها" itemLabel="پاراگراف" addLabel="افزودن پاراگراف"
            items={section.paragraphs} limit={20} makeItem={() => ''}
            onChange={paragraphs => setSection({ ...section, paragraphs })}
            fields={(paragraph, setParagraph, index) => (
              <ArticleField label={'متن پاراگراف ' + formatNumber(index + 1)} rows={4} maxLength={12000}
                value={paragraph} onChange={setParagraph} />
            )}
          />
          <details className="cms-text-settings">
            <summary>تصویر این بخش{section.image ? ' · انتخاب شده' : ''}</summary>
            <MediaSlot title={section.title || 'تصویر بخش'} photo={section.image}
              onChange={image => setSection({ ...section, image })}
              onUpload={file => onUpload({ sectionIndex }, file)} />
          </details>
        </>}
      />
      <details className="article-writing-help">
        <summary>راهنمای پیوند و ارجاع در متن</summary>
        <p>برای پیوند داخلی، عنوان را داخل کروشه و نشانی را داخل پرانتز بنویسید. برای ارجاع به اولین منبع از [۱] استفاده کنید.</p>
        <code dir="ltr">[عنوان پیوند](/articles/label-reading)</code>
      </details>
    </Panel>
  );
}

export function ArticleQuestions({ fields, change }: EditorProps) {
  return (
    <Panel title="پرسش‌های رایج" description="هر پرسش با پاسخ بازشونده در انتهای متن نمایش داده می‌شود.">
      <CmsRows title="فهرست پرسش‌ها" itemLabel="پرسش" addLabel="افزودن پرسش"
        items={fields.faq} limit={10} makeItem={() => ({ question: '', answer: '' })}
        summary={item => item.question} onChange={items => change('faq', items)}
        fields={(item, setItem) => <>
          <ArticleField label="پرسش" maxLength={300} value={item.question} onChange={question => setItem({ ...item, question })} />
          <ArticleField label="پاسخ" rows={3} maxLength={3000} value={item.answer} onChange={answer => setItem({ ...item, answer })} />
        </>}
      />
      <CmsTextSettings defaults={articleCopy} overrides={fields.pageText} onChange={value => change('pageText', value)}
        fields={[{ key: 'questionsTitle', label: 'عنوان پرسش‌ها روی سایت' }]} />
    </Panel>
  );
}

export function ArticleSources({ fields, change }: EditorProps) {
  return (
    <Panel title="منابع" description="شمارهٔ ارجاع‌ها در متن را با ترتیب منابع هماهنگ کنید.">
      <CmsRows title="فهرست منابع" itemLabel="منبع" addLabel="افزودن منبع"
        items={fields.sources} limit={15} makeItem={() => ({ title: '', url: '' })} ordered={false}
        summary={source => source.title || source.url} onChange={sources => change('sources', sources)}
        fields={(source, setSource) => <>
          <ArticleField label="عنوان منبع" maxLength={240} value={source.title} onChange={title => setSource({ ...source, title })} />
          <ArticleField label="نشانی منبع" maxLength={1800} dir="ltr" value={source.url} placeholder="https://"
            onChange={url => setSource({ ...source, url })} />
        </>}
      />
      <CmsTextSettings defaults={articleCopy} overrides={fields.pageText} onChange={value => change('pageText', value)}
        fields={[{ key: 'sourcesTitle', label: 'عنوان منابع' }, { key: 'sourcesNote', label: 'یادداشت پایین منابع', rows: 4 }]} />
    </Panel>
  );
}

function MediaSlot({ title, description, photo, onChange, onUpload, defaultCaption = '' }: {
  title: string;
  description?: string;
  photo?: ArticlePhoto | null;
  onChange: (photo: ArticlePhoto | null) => void;
  onUpload: (file: File) => void;
  defaultCaption?: string;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <Panel title={title} description={description}>
      <div className="article-media-slot">
        <div className="article-media-thumb">
          {photo ? <img src={mediaHref(photo.key)} alt={photo.alt} loading="lazy" /> : <span>تصویری انتخاب نشده</span>}
        </div>
        <div className="article-media-controls">
          <div className="admin-actions">
            <button type="button" className="admin-button admin-button--secondary" onClick={() => setPicking(true)}>
              <AdminIcon name="media" size={17} /> کتابخانهٔ رسانه
            </button>
            <label className="admin-button admin-button--secondary cms-media-upload">
              <AdminIcon name="upload" size={17} /> بارگذاری فایل
              <input className="sr-only" type="file" accept={MEDIA_ACCEPT} aria-label={`بارگذاری فایل برای ${title}`}
                onChange={event => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = '';
                  if (file) onUpload(file);
                }} />
            </label>
          </div>
          {photo && <>
            <ArticleField label="متن جایگزین تصویر" maxLength={240} value={photo.alt} onChange={alt => onChange({ ...photo, alt })}
              hint="موضوع تصویر را با یک جملهٔ کوتاه توصیف کنید." />
            <ArticleField label="کپشن روی سایت" maxLength={240} value={photo.caption ?? defaultCaption}
              onChange={caption => onChange({ ...photo, caption })} />
            <button type="button" className="cms-media-remove" onClick={() => onChange(null)}>برداشتن تصویر</button>
          </>}
        </div>
      </div>
      {picking && <CmsMediaPicker label={title} selectedKey={photo?.key} onClose={() => setPicking(false)}
        onChoose={asset => onChange({ key: asset.key, alt: '' })} />}
    </Panel>
  );
}

const mediaSlots = [
  { id: 'cover', label: 'کاور' },
  { id: 'bodyImage', label: 'تصویر داخل مقاله' },
  { id: 'section', label: 'تصاویر بخش‌ها' },
] as const;

export function ArticleMedia({ fields, change, onUpload }: EditorProps & { onUpload: UploadImage }) {
  const [location, setLocation] = useState<typeof mediaSlots[number]['id']>('cover');
  const [selectedSection, setSelectedSection] = useState(0);
  const sectionIndex = Math.min(selectedSection, fields.sections.length - 1);
  const section = fields.sections[sectionIndex];

  return (
    <div className="article-tab-stack">
      <div className="admin-filter-pills article-filters" role="group" aria-label="جای تصویر در مقاله">
        {mediaSlots.map(slot => <button key={slot.id} className="at-pill" type="button" aria-pressed={location === slot.id}
          onClick={() => setLocation(slot.id)}>{slot.label}</button>)}
      </div>
      {location === 'cover' && <MediaSlot key="cover" title="تصویر کاور" description="در کارت مجله و بالای صفحهٔ مقاله نمایش داده می‌شود."
        photo={fields.cover} onChange={photo => change('cover', photo)} onUpload={file => onUpload('cover', file)} />}
      {location === 'bodyImage' && <>
        <MediaSlot key="body" title="تصویر داخل مقاله" description="جای نمایش تصویر را در فیلد بعدی انتخاب کنید."
          photo={fields.bodyImage} defaultCaption={fields.bodyImage ? `${fields.bodyImage.alt} · تصویرسازی` : ''}
          onChange={photo => change('bodyImage', photo)} onUpload={file => onUpload('bodyImage', file)} />
        {fields.bodyImage && <Panel title="جای تصویر داخل مقاله">
          <label className="admin-field">
            <span>نمایش تصویر پس از</span>
            <select className="admin-input" value={fields.bodyImageAfter ?? fields.sections[1]?.id ?? ''} onChange={event => change('bodyImageAfter', event.target.value)}>
              <option value="">مقدمه و نکته‌های کلیدی</option>
              {fields.sections.map((item, index) => <option key={index} value={item.id}>
                {item.title || 'بخش ' + formatNumber(index + 1)}
              </option>)}
            </select>
          </label>
        </Panel>}
      </>}
      {location === 'section' && <>
        <Panel title="تصویر هر بخش">
          {section ? <label className="admin-field">
            <span>بخش مقاله</span>
            <select className="admin-input" value={sectionIndex} onChange={event => setSelectedSection(Number(event.target.value))}>
              {fields.sections.map((item, index) => <option key={index} value={index}>
                {item.title || 'بخش ' + formatNumber(index + 1)}{item.image ? ' · تصویر دارد' : ''}
              </option>)}
            </select>
          </label> : <p className="article-field-hint">ابتدا از بدنهٔ مقاله یک بخش اضافه کنید.</p>}
        </Panel>
        {section && <MediaSlot key={sectionIndex} title={section.title || 'تصویر بخش'} photo={section.image}
          onChange={image => change('sections', editRow(fields.sections, sectionIndex, { ...section, image }))}
          onUpload={file => onUpload({ sectionIndex }, file)} />}
      </>}
    </div>
  );
}

export function ArticleSeo({ fields, change }: EditorProps) {
  return (
      <Panel title="نمایش در جست‌وجو" description="در صورت خالی‌بودن این فیلدها، عنوان و خلاصهٔ مقاله استفاده می‌شوند.">
        <ArticleField label="عنوان سئو" maxLength={100} value={fields.seoTitle}
          hint={formatNumber(fields.seoTitle.length) + ' از ۱۰۰ نویسه'} onChange={value => change('seoTitle', value)} />
        <ArticleField label="توضیح متا" rows={3} maxLength={200} value={fields.metaDescription}
          hint={formatNumber(fields.metaDescription.length) + ' از ۲۰۰ نویسه'} onChange={value => change('metaDescription', value)} />
        <div className="article-search-snippet">
          <small>پیش‌نمایش نتیجهٔ جست‌وجو</small>
          <bdi dir="ltr">{siteOrigin}/articles/{fields.slug || 'article-slug'}</bdi>
          <strong>{fields.seoTitle || fields.title || 'عنوان مقاله'}</strong>
          <p>{fields.metaDescription || fields.excerpt || 'توضیح مقاله'}</p>
        </div>
      </Panel>
  );
}

export function ArticleRelations({ fields, change, articles, recipes, recipeStatus, onRetryRecipes }: EditorProps & {
  articles: ArticleSummary[];
  recipes: RecipeChoice[];
  recipeStatus: 'idle' | 'loading' | 'ready' | 'error';
  onRetryRecipes: () => void;
}) {
  return (
      <Panel title="محتوای مرتبط" description="مقاله‌ها، رسپی‌ها و طعم‌های مرتبط را انتخاب کنید و ترتیب نمایش را تعیین کنید.">
        <CmsTextSettings defaults={articleCopy} overrides={fields.pageText} onChange={value => change('pageText', value)}
          fields={[
            { key: 'productsTitle', label: 'عنوان پیوندهای محصول' },
            { key: 'relatedRecipesLabel', label: 'روتیتر رسپی‌های مرتبط' },
            { key: 'relatedRecipesTitle', label: 'عنوان رسپی‌های مرتبط' },
            { key: 'relatedArticlesTitle', label: 'عنوان مقالات مرتبط' },
          ]} />
        <CmsRelations label="مقالات مرتبط" choices={articles.filter(article => article.slug !== fields.slug)}
          selected={fields.relatedArticleSlugs} onChange={value => change('relatedArticleSlugs', value)} />
        {recipeStatus === 'loading' && <p className="article-field-hint" role="status">در حال دریافت رسپی‌ها…</p>}
        {recipeStatus === 'error' && <div className="admin-alert admin-alert--error article-inline-alert" role="alert">
          <p>فهرست رسپی‌ها بارگذاری نشد.</p>
          <button type="button" className="admin-button admin-button--secondary" onClick={onRetryRecipes}>تلاش دوباره</button>
        </div>}
        <CmsRelations label="رسپی‌های مرتبط" choices={recipes} selected={fields.relatedRecipeSlugs}
          onChange={value => change('relatedRecipeSlugs', value)} />
        <CmsRelations label="طعم‌های ات‌مت" choices={productChoices} selected={fields.productSlugs}
          onChange={value => change('productSlugs', value)} />
      </Panel>
  );
}
