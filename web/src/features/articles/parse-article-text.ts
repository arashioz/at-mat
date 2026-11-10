type Part =
  | { type: 'text'; value: string }
  | { type: 'link'; label: string; href: string }
  | { type: 'citations'; entries: { label: string; source: number }[] };

const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const sourceNumber = (value: string) => Number(value.replace(/[۰-۹]/g, digit => String(faDigits.indexOf(digit))));

/** Accept the magazine's internal links and numbered citations without parsing raw HTML. */
export function parseArticleText(text: string): Part[] {
  return text.split(/(\[[^\]]+\]\(\/(?:articles|recipes|flavors)\/[a-z0-9-]+(?:#[a-z0-9-]+)?\)|\[[۰-۹0-9،,\s]+\])/g).map(part => {
    const link = part.match(/^\[([^\]]+)\]\((\/(?:articles|recipes|flavors)\/[a-z0-9-]+(?:#[a-z0-9-]+)?)\)$/);
    if (link) return { type: 'link', label: link[1], href: link[2] };
    if (/^\[[۰-۹0-9،,\s]+\]$/.test(part)) {
      const entries = part.slice(1, -1).split(/[،,]/).map(value => {
        const label = value.trim();
        return { label, source: sourceNumber(label) };
      });
      return { type: 'citations', entries };
    }
    return { type: 'text', value: part };
  });
}
