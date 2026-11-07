import Link from 'next/link';
import { BrandEdge } from '@/features/brine/brand-edge';
import { RecipeArrow } from './recipe-card';
import { RecipeMotion } from './recipe-motion';
import { getFlavor, flavors } from '@/features/products/catalog';
import type { CSSProperties } from 'react';
import './recipes.css';

export function RecipeShell({ logo, children, flavor = 'brine', section = 'recipes' }: { logo: string; children: React.ReactNode; flavor?: string; section?: 'recipes' | 'articles' }) {
  const theme = getFlavor(flavor)?.theme;
  const style = { '--r-accent': section === 'articles' ? '#147b59' : theme?.accent ?? '#2d85cd', '--r-paper': section === 'articles' ? '#f8f4ec' : theme?.pale ?? '#e9f2f8', '--r-deep': section === 'articles' ? '#0b302f' : theme?.navy ?? '#082438' } as CSSProperties;
  return (
    <RecipeMotion style={style}>
      <header className="r-nav">
        <Link href="/" className="r-nav__logo" aria-label="ات‌مت، صفحهٔ اصلی"><img src={logo} alt="ات‌مت" width="700" height="447" /></Link>
        <nav aria-label="بخش‌های سایت"><Link href="/recipes" aria-current={section === 'recipes' ? 'page' : undefined}>رسپی‌ها</Link><Link href="/articles" aria-current={section === 'articles' ? 'page' : undefined}>مقالات</Link><Link href="/flavors/brine">طعم‌های ات‌مت <span aria-hidden="true">↗</span></Link></nav>
        <span className="r-nav__caption">از قوطی تا سفره.</span>
      </header>
      {children}
      <footer className="r-footer">
        <BrandEdge id="recipe-footer-edge" className="r-footer__edge" fillBelow />
        <div className="r-footer__brand"><img src={logo} alt="ات‌مت" width="700" height="447" /><p>یه دنیا مزه،<br /><span>به سلیقهٔ تو.</span></p></div>
        <div className="r-footer__links"><Link href="/recipes">همهٔ رسپی‌ها <RecipeArrow /></Link><Link href="/articles">مجلهٔ ات‌مت <RecipeArrow /></Link>{flavors.map(flavor => <Link key={flavor.slug} href={`/flavors/${flavor.slug}`}>تن {flavor.label} <RecipeArrow /></Link>)}</div>
        <div className="r-footer__bottom"><span>© ۱۴۰۵ ات‌مت</span><a href="#main-content">برگردیم بالا ↑</a></div>
      </footer>
    </RecipeMotion>
  );
}
