import Link from 'next/link';
import { parseArticleText } from './parse-article-text';

export function ArticleText({ text }: { text: string }) {
  return <>{parseArticleText(text).map((part, index) => {
    if (part.type === 'link') return <Link key={index} href={part.href}>{part.label}</Link>;
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
