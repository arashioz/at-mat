import { SiteNavigation } from '@/features/site/site-navigation';
import { SiteFooter } from '@/features/site/site-footer';
import { RecipeMotion } from './recipe-motion';
import { getFlavor } from '@/features/products/catalog';
import type { CSSProperties } from 'react';
import './recipes.css';

export function RecipeShell({ logo, children, flavor = 'brine', section = 'recipes' }: { logo: string; children: React.ReactNode; flavor?: string; section?: 'recipes' | 'articles' }) {
  const theme = getFlavor(flavor)?.theme;
  const style = { '--r-accent': section === 'articles' ? '#147b59' : theme?.accent ?? '#2d85cd', '--r-paper': section === 'articles' ? '#f8f4ec' : theme?.pale ?? '#e9f2f8', '--r-deep': section === 'articles' ? '#0b302f' : theme?.navy ?? '#082438' } as CSSProperties;
  return (
    <RecipeMotion style={style}>
      <SiteNavigation logo={logo} flavor={flavor} section={section} />
      {children}
      <SiteFooter logo={logo} flavor={flavor} />
    </RecipeMotion>
  );
}
