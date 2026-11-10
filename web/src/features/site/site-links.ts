export type SiteSection = 'recipes' | 'articles' | 'about' | 'collaboration';

export const siteLinks = [
  { href: '/', label: 'صفحهٔ اصلی' },
  { href: '#site-flavors', label: 'محصولات' },
  { href: '/recipes', label: 'رسپی‌ها' },
  { href: '/articles', label: 'مقالات' },
  { href: '/about', label: 'دربارهٔ ما' },
  { href: '/collaboration', label: 'همکاری با ات‌مت' },
] as const;
