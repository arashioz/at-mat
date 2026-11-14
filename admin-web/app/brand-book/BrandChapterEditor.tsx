'use client';

import type { Chapter, Source, SourceId } from './brand-book-api';

export function BrandChapterEditor({ chapter, sources, onChange }: {
  chapter: Chapter; sources: Source[]; onChange: (chapter: Chapter) => void;
}) {
  return <div className="brand-chapter-editor">
    <label className="admin-field">عنوان فصل<input className="admin-input" required maxLength={120} value={chapter.title} onChange={event => onChange({ ...chapter, title: event.target.value })} /></label>
    <label className="admin-field">خلاصهٔ فصل<textarea className="admin-input" required maxLength={800} value={chapter.summary} onChange={event => onChange({ ...chapter, summary: event.target.value })} /></label>
    {chapter.sections.map((section, index) => <div className="brand-edit-block" key={index}>
      <label className="admin-field">عنوان بخش<input className="admin-input" required maxLength={120} value={section.title} onChange={event => onChange({ ...chapter, sections: chapter.sections.map((item, i) => i === index ? { ...item, title: event.target.value } : item) })} /></label>
      <label className="admin-field">متن بخش<textarea className="admin-input" rows={5} required maxLength={4000} value={section.body} onChange={event => onChange({ ...chapter, sections: chapter.sections.map((item, i) => i === index ? { ...item, body: event.target.value } : item) })} /></label>
      <button className="admin-button admin-button--danger" type="button" disabled={chapter.sections.length === 1} onClick={() => onChange({ ...chapter, sections: chapter.sections.filter((_, i) => i !== index) })}>حذف بخش</button>
    </div>)}
    <button className="admin-button admin-button--secondary" type="button" disabled={chapter.sections.length >= 12} onClick={() => onChange({ ...chapter, sections: [...chapter.sections, { title: '', body: '' }] })}>افزودن بخش</button>
    <h3>ارجاع‌های فصل</h3>
    {chapter.references.map((reference, index) => <div className="brand-reference-edit" key={index}>
      <label className="admin-field">سند<select className="admin-input" value={reference.source} onChange={event => onChange({ ...chapter, references: chapter.references.map((item, i) => i === index ? { ...item, source: event.target.value as SourceId } : item) })}>
        {sources.map(source => <option key={source.id} value={source.id}>{source.label}</option>)}
      </select></label>
      <label className="admin-field">شمارهٔ صفحه یا فصل<input className="admin-input" maxLength={140} value={reference.location} onChange={event => onChange({ ...chapter, references: chapter.references.map((item, i) => i === index ? { ...item, location: event.target.value } : item) })} /></label>
      <button className="admin-button admin-button--danger" type="button" onClick={() => onChange({ ...chapter, references: chapter.references.filter((_, i) => i !== index) })}>حذف ارجاع</button>
    </div>)}
    <button className="admin-button admin-button--secondary" type="button" disabled={chapter.references.length >= 6} onClick={() => onChange({ ...chapter, references: [...chapter.references, { source: sources[0].id, location: '' }] })}>افزودن ارجاع</button>
  </div>;
}
