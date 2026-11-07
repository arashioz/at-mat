import Link from 'next/link';
const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const number = (s: string) => Number(s.replace(/[۰-۹]/g, c => String(faDigits.indexOf(c))));
/** Render only local editorial links and citations; content never becomes raw HTML. */
export function ArticleText({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\]\(\/(?:articles|recipes|flavors)\/[a-z0-9-]+(?:#[a-z0-9-]+)?\)|\[[۰-۹0-9،,\s]+\])/g).map((part, i) => {
    const link = part.match(/^\[([^\]]+)\]\((\/[^)]+)\)$/);
    if (link) return <Link key={i} href={link[2]}>{link[1]}</Link>;
    if (/^\[[۰-۹0-9،,\s]+\]$/.test(part)) return <sup className="a-citation" key={i}>{part.slice(1, -1).split(/[،,]/).map((n, j) => <a key={j} href={`#source-${number(n.trim())}`} aria-label={`منبع ${n.trim()}`}>[{n.trim()}]</a>)}</sup>;
    return part;
  })}</>;
}
