import { useId } from 'react';
import { RECIPE_FLAVORS, type RecipeFields } from '../../lib/recipes';
import { CmsRows } from '../CmsRows';
import { CmsRelations, CmsTextSettings, type CmsRelationChoice } from '../CmsEditor';
import { recipeCopy } from '../../../backend/src/common/content-copy';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
  hint?: string;
  placeholder?: string;
  options?: string[];
  wide?: boolean;
  dir?: 'ltr';
  readOnly?: boolean;
  hideLabel?: boolean;
}

export function RecipeTextField({
  label, value, onChange, maxLength, rows, hint, placeholder, options, wide, dir, readOnly, hideLabel,
}: TextFieldProps) {
  const id = useId();
  const fieldProps = {
    value,
    maxLength,
    placeholder,
    dir,
    readOnly,
    className: 'admin-input',
    'aria-labelledby': `${id}-label`,
    'aria-describedby': hint ? `${id}-hint` : undefined,
  };

  return (
    <label className={`admin-field${wide ? ' recipe-fields__wide' : ''}`}>
      <span className={hideLabel ? 'sr-only' : undefined} id={`${id}-label`}>{label}</span>
      {rows ? (
        <textarea {...fieldProps} rows={rows} onChange={event => onChange(event.target.value)} />
      ) : (
        <input
          {...fieldProps}
          onChange={event => onChange(event.target.value)}
          list={options?.length ? `${id}-options` : undefined}
          spellCheck={dir === 'ltr' ? false : undefined}
          autoCapitalize={dir === 'ltr' ? 'off' : undefined}
        />
      )}
      {options?.length ? (
        <datalist id={`${id}-options`}>{options.map(option => <option key={option} value={option} />)}</datalist>
      ) : null}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}

type UpdateField = <Key extends keyof RecipeFields>(key: Key, value: RecipeFields[Key]) => void;
type EditorFields = { draft: RecipeFields; update: UpdateField };

export function RecipeBasics({
  draft, update, slug, setSlug, existing, categories,
}: {
  draft: RecipeFields;
  update: UpdateField;
  slug: string;
  setSlug: (slug: string) => void;
  existing: boolean;
  categories: string[];
}) {
  return (
    <div className="recipe-fields__grid">
      <RecipeTextField label="نام رسپی" value={draft.title} maxLength={200} onChange={value => update('title', value)} />
      <RecipeTextField
        label="شناسهٔ آدرس"
        value={slug}
        maxLength={90}
        onChange={setSlug}
        readOnly={existing}
        placeholder="tuna-tomato-pasta"
        dir="ltr"
        hint={existing ? 'این شناسه آدرس رسپی روی سایت است.' : 'اختیاری. اگر خالی بماند خودکار ساخته می‌شود و پس از ذخیره ثابت می‌ماند.'}
      />
      <RecipeTextField label="دسته‌بندی" value={draft.category} maxLength={120} onChange={value => update('category', value)} options={categories} />
      <label className="admin-field">
        <span>محصول ات‌مت</span>
        <select className="admin-input" value={draft.flavor} onChange={event => {
          const flavor = event.target.value;
          update('flavor', flavor);
          update('flavorLabel', RECIPE_FLAVORS.find(([key]) => key === flavor)?.[1] ?? '');
        }}>
          <option value="">انتخاب طعم</option>
          {RECIPE_FLAVORS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <RecipeTextField label="نام طعم در متن" value={draft.flavorLabel} maxLength={120} onChange={value => update('flavorLabel', value)} />
    </div>
  );
}

export function RecipeIntro({ draft, update }: EditorFields) {
  return (
    <div className="recipe-fields__stack">
      <RecipeTextField label="معرفی رسپی" value={draft.intro} maxLength={2000} rows={4} onChange={value => update('intro', value)} />
      <div className="recipe-fields__grid">
        <RecipeTextField label="تعداد نفرات یا وعده" value={draft.servings} maxLength={120} onChange={value => update('servings', value)} placeholder="۲ نفر" />
        <RecipeTextField label="زمان تهیه" value={draft.duration} maxLength={120} onChange={value => update('duration', value)} placeholder="۲۰ دقیقه" />
        <RecipeTextField label="درجهٔ سختی" value={draft.difficulty} maxLength={120} onChange={value => update('difficulty', value)} options={['آسان', 'متوسط', 'سخت']} />
        <RecipeTextField label="جزئیات زمان‌بندی" value={draft.timing} maxLength={120} onChange={value => update('timing', value)} placeholder="۱۰ دقیقه آماده‌سازی، ۱۰ دقیقه پخت" wide />
      </div>
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[{ key: 'startCooking', label: 'دکمهٔ رفتن به مواد لازم' }]} />
    </div>
  );
}

export function RecipeIngredients({ draft, update }: EditorFields) {
  return (
    <div className="recipe-fields__stack">
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[{ key: 'ingredientsLabel', label: 'روتیتر مواد لازم' }, { key: 'ingredientsTitle', label: 'عنوان مواد لازم' }]} />
      <CmsRows
        title="فهرست مواد"
        itemLabel="ماده"
        addLabel="افزودن ماده"
        items={draft.ingredients}
        limit={50}
        makeItem={() => ''}
        onChange={items => update('ingredients', items)}
        fields={(item, change) => <RecipeTextField label="مقدار و نام ماده" hideLabel value={item} maxLength={500} onChange={change} placeholder="۱ قوطی تن ماهی ات‌مت" />}
      />
    </div>
  );
}

export function RecipeMethod({ draft, update }: EditorFields) {
  return (
    <div className="recipe-fields__stack">
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[
          { key: 'methodLabel', label: 'روتیتر طرز تهیه' },
          { key: 'methodTitle', label: 'عنوان طرز تهیه', rows: 2 },
          { key: 'preparationTitle', label: 'عنوان آماده‌سازی' },
          { key: 'tipLabel', label: 'روتیتر نکتهٔ پایانی' },
          { key: 'tipTitle', label: 'عنوان نکتهٔ پایانی' },
        ]} />
      <RecipeTextField label="آماده‌سازی تن ماهی" value={draft.preparation} maxLength={4000} rows={3} onChange={value => update('preparation', value)} hint="این متن پیش از مراحل اصلی نمایش داده می‌شود." />
      <CmsRows
        title="مراحل پخت"
        itemLabel="مرحله"
        addLabel="افزودن مرحله"
        items={draft.steps}
        summary={item => item.title}
        limit={30}
        makeItem={() => ({ title: '', text: '' })}
        onChange={items => update('steps', items)}
        fields={(item, change) => (
          <div className="recipe-fields__pair">
            <RecipeTextField label="عنوان مرحله" value={item.title} maxLength={200} onChange={title => change({ ...item, title })} />
            <RecipeTextField label="توضیح مرحله" value={item.text} maxLength={4000} rows={3} onChange={text => change({ ...item, text })} />
          </div>
        )}
      />
      <RecipeTextField label="نکتهٔ پایانی" value={draft.tip} maxLength={4000} rows={3} onChange={value => update('tip', value)} />
    </div>
  );
}

export function RecipeExtraSections({ draft, update }: EditorFields) {
  return (
    <div className="recipe-fields__stack">
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[{ key: 'extraTitle', label: 'عنوان بخش‌های تکمیلی' }]} />
      <CmsRows
        title="فهرست بخش‌های تکمیلی"
        itemLabel="بخش"
        addLabel="افزودن بخش"
        items={draft.extraSections ?? []}
        summary={item => item.title}
        limit={12}
        makeItem={() => ({ title: '', text: '' })}
        onChange={sections => update('extraSections', sections.length ? sections : undefined)}
        fields={(item, change) => (
          <div className="recipe-fields__pair">
            <RecipeTextField label="عنوان بخش" value={item.title} maxLength={180} onChange={title => change({ ...item, title })} />
            <RecipeTextField label="متن بخش" value={item.text} maxLength={6000} rows={5} onChange={text => change({ ...item, text })} />
          </div>
        )}
      />
    </div>
  );
}

export function RecipeNutrition({ draft, update }: EditorFields) {
  const nutrition = draft.nutrition;
  return (
    <div className="recipe-fields__stack">
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[
          { key: 'nutritionLabel', label: 'روتیتر ارزش غذایی' },
          { key: 'nutritionTitle', label: 'عنوان ارزش غذایی', rows: 2 },
          { key: 'nutritionIntro', label: 'شروع یادداشت ارزش غذایی' },
          { key: 'nutritionOutro', label: 'پایان یادداشت ارزش غذایی', rows: 2 },
        ]} />
      <RecipeTextField label="اندازهٔ هر وعده" value={nutrition.serving} maxLength={120} onChange={serving => update('nutrition', { ...nutrition, serving })} />
      <CmsRows
        title="جدول ارزش غذایی"
        itemLabel="مقدار غذایی"
        addLabel="افزودن مقدار"
        items={nutrition.rows}
        summary={item => [item.name, item.value].filter(Boolean).join(' · ')}
        limit={30}
        makeItem={() => ({ name: '', value: '' })}
        onChange={rows => update('nutrition', { ...nutrition, rows })}
        fields={(item, change) => (
          <div className="recipe-fields__grid">
            <RecipeTextField label="نام" value={item.name} maxLength={160} onChange={name => change({ ...item, name })} placeholder="پروتئین" />
            <RecipeTextField label="مقدار" value={item.value} maxLength={160} onChange={value => change({ ...item, value })} placeholder="۱۴ گرم" />
          </div>
        )}
      />
      <RecipeTextField label="یادداشت برآورد تغذیه‌ای" value={nutrition.note} maxLength={3000} rows={3} onChange={note => update('nutrition', { ...nutrition, note })} />
    </div>
  );
}

export function RecipeQuestions({ draft, update }: EditorFields) {
  return (
    <div className="recipe-fields__stack">
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[{ key: 'questionsLabel', label: 'روتیتر پرسش‌ها' }, { key: 'questionsTitle', label: 'عنوان پرسش‌ها', rows: 2 }]} />
      <CmsRows
        title="پرسش‌های متداول"
        itemLabel="پرسش"
        addLabel="افزودن پرسش"
        items={draft.faq}
        summary={item => item.question}
        limit={20}
        makeItem={() => ({ question: '', answer: '' })}
        onChange={items => update('faq', items)}
        fields={(item, change) => (
          <div className="recipe-fields__pair">
            <RecipeTextField label="پرسش" value={item.question} maxLength={300} onChange={question => change({ ...item, question })} />
            <RecipeTextField label="پاسخ" value={item.answer} maxLength={4000} rows={3} onChange={answer => change({ ...item, answer })} />
          </div>
        )}
      />
    </div>
  );
}

function RecipeRelationList({ label, choices, selected, onChange }: {
  label: string;
  choices: readonly CmsRelationChoice[];
  selected?: string[];
  onChange: (values?: string[]) => void;
}) {
  return (
    <div className="recipe-fields__pair">
      <label className="admin-field">
        <span>روش انتخاب {label}</span>
        <select className="admin-input" value={selected ? 'manual' : 'automatic'}
          onChange={event => onChange(event.target.value === 'manual' ? [] : undefined)}>
          <option value="automatic">پیشنهاد خودکار</option>
          <option value="manual">انتخاب دستی</option>
        </select>
      </label>
      {selected && <CmsRelations label={label} choices={choices} selected={selected} onChange={onChange} />}
      {selected?.length === 0 && <p className="recipe-muted">با فهرست خالی، این بخش در سایت نمایش داده نمی‌شود.</p>}
    </div>
  );
}

export function RecipeRelations({ draft, update, recipes, articles, articleError, onRetry }: EditorFields & {
  recipes: readonly CmsRelationChoice[];
  articles: readonly CmsRelationChoice[] | null;
  articleError: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="recipe-fields__stack">
      <CmsTextSettings defaults={recipeCopy} overrides={draft.pageText} onChange={value => update('pageText', value)}
        fields={[
          { key: 'relatedRecipesTitle', label: 'عنوان رسپی‌های مرتبط', rows: 2 },
          { key: 'relatedArticlesLabel', label: 'روتیتر مقالات مرتبط' },
          { key: 'relatedArticlesTitle', label: 'عنوان مقالات مرتبط' },
        ]} />
      <RecipeRelationList label="رسپی‌های مرتبط" choices={recipes} selected={draft.relatedRecipeSlugs}
        onChange={values => update('relatedRecipeSlugs', values)} />
      {articleError && <div className="admin-alert admin-alert--error" role="alert">
        <p>فهرست مقالات بارگذاری نشد.</p>
        <button type="button" className="admin-button admin-button--secondary" onClick={onRetry}>تلاش دوباره</button>
      </div>}
      {!articles && !articleError && <p className="recipe-muted" role="status">در حال دریافت مقالات…</p>}
      <RecipeRelationList label="مقالات مرتبط" choices={articles ?? []} selected={draft.relatedArticleSlugs}
        onChange={values => update('relatedArticleSlugs', values)} />
    </div>
  );
}

export function RecipeSeo({ draft, update, slug }: { draft: RecipeFields; update: UpdateField; slug: string }) {
  return (
    <div className="recipe-fields__stack">
      <RecipeTextField label="عنوان برای موتور جست‌وجو" value={draft.seoTitle} maxLength={200} onChange={value => update('seoTitle', value)} />
      <RecipeTextField label="توضیح نتیجهٔ جست‌وجو" value={draft.metaDescription} maxLength={400} rows={3} onChange={value => update('metaDescription', value)} />
      <div className="recipe-seo-example">
        <span>پیش‌نمایش اطلاعات جست‌وجو</span>
        <bdi dir="ltr">/recipes/{slug || 'recipe-slug'}</bdi>
        <strong>{draft.seoTitle || draft.title || 'عنوان رسپی'}</strong>
        <p>{draft.metaDescription || 'توضیح رسپی در این قسمت نمایش داده می‌شود.'}</p>
      </div>
    </div>
  );
}
