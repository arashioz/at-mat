export function newCmsSlug(kind: 'article' | 'recipe', title: string) {
  const prefix = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 65).replace(/^-|-$/g, '') || kind;
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(5)), byte => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${suffix}`;
}
