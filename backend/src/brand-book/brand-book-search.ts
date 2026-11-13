import { BrandChapter } from './brand-book.content';

const stopWords = new Set('ایا چرا چطور چگونه چجوری چند چه چیست چیه کدام کجا برای درباره باره لطفا بگو برند برندبوک بوک اتمت ات مت یک است این ان با از در به که را و تا ها های ما یا بود دارد شده می شود can the a is are what how for about of and at mat'.split(' '));
const normalize = (text: string) => text.toLowerCase()
  .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[أإآ]/g, 'ا')
  .replace(/[\u064b-\u065f\u0640]/g, '').replace(/\u200c/g, ' ')
  .replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) & 15));
const terms = (text: string): string[] => (normalize(text).match(/[\p{L}\p{N}]+/gu) ?? []);
const aliases: Record<string, string> = {
  لوگو: 'نشان', logo: 'نشان', رنگها: 'رنگ', palette: 'رنگ', colors: 'رنگ',
  کمپین: 'لانچ', launch: 'لانچ', gtm: 'لانچ', pilot: 'پایلوت', تست: 'نمونه‌چشانی',
  پرسونای: 'مخاطب', پرسونا: 'مخاطب', audience: 'مخاطب', positioning: 'جایگاه',
  شعار: 'جوهره روایت', tagline: 'جوهره روایت', tone: 'لحن', voice: 'لحن',
  سنجه: 'شاخص', سنجه‌ها: 'شاخص', kpi: 'شاخص', شاخصها: 'شاخص',
  تبلیغات: 'رسانه محتوا', تبلیغ: 'رسانه محتوا', website: 'وب سایت', distribution: 'توزیع',
  packaging: 'بسته بندی', qr: 'qr', چهارهفته: 'پایلوت',
};

export function answerFromBrandBook(chapters: BrandChapter[], question: string) {
  const query = [...new Set(terms(question).filter(word => word.length > 1 && !stopWords.has(word)))];
  const candidates = chapters.flatMap(chapter => chapter.sections.map(section => ({
    chapter,
    section,
    chapterWords: new Set(terms(chapter.title)),
    titleWords: new Set(terms(section.title)),
    bodyWords: new Set(terms(section.body)),
  })));
  const ranked = candidates.map(entry => {
    let matches = 0;
    const score = query.reduce((total, word) => {
      const variants = [word, ...terms(Object.prototype.hasOwnProperty.call(aliases, word) ? aliases[word] : '')];
      const weight = Math.max(...variants.map(term =>
        (entry.titleWords.has(term) ? 5 : 0) + (entry.chapterWords.has(term) ? 2 : 0) + (entry.bodyWords.has(term) ? 2 : 0)));
      if (weight) matches++;
      return total + weight;
    }, 0);
    return { ...entry, score, matches };
  }).filter(entry => entry.score >= 2 && entry.matches >= Math.ceil(query.length * 0.4))
    .sort((a, b) => b.matches - a.matches || b.score - a.score);
  const best = ranked[0];
  if (!best) return [];
  const direct = ranked.filter(entry => entry.matches === best.matches && entry.score >= best.score * 0.72);
  const related = query.length > 1 ? ranked.filter(entry =>
    entry.chapter.id === best.chapter.id && !direct.includes(entry) && entry.score >= best.score * 0.55) : [];
  return [...direct, ...related]
    .slice(0, 3).map(({ chapter, section }) => ({
      chapterId: chapter.id, chapterTitle: chapter.title, title: section.title, text: section.body, references: chapter.references,
    }));
}
