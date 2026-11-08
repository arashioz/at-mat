'use client';

import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from 'react';
import { usePathname } from 'next/navigation';
import { siteLinks } from './site-links';

type NavProduct = { slug: string; label: string; wrap: string; lid: string };

const productShortcuts = [
  { href: '#details', label: 'مشخصات', icon: 'details' },
  { href: '#recipes', label: 'ایدهٔ سرو', icon: 'serving' },
] as const;

function NavIcon({ name }: { name: 'details' | 'serving' | 'recipes' | 'articles' }) {
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'details' && <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h6M9 16h3" /></>}
    {name === 'serving' && <><path d="M3 15h18M5 15a7 7 0 0 1 14 0M12 5v3M10 5h4M4 19h16" /></>}
    {name === 'recipes' && <><path d="M7 3v7M4 3v5a3 3 0 0 0 6 0V3M7 11v10M19 21V3c-4 2-5 6-5 10h5" /></>}
    {name === 'articles' && <><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 7h8M8 11h8M8 15h3M8 18h6" /></>}
  </svg>;
}

function CanThumbnail({ product }: { product: NavProduct }) {
  const style = { '--can-wrap': `url("${product.wrap}")`, '--can-lid': `url("${product.lid}")` } as CSSProperties;
  return <span className="site-can" style={style} aria-hidden="true"><span className="site-can__body" /><span className="site-can__lid" /></span>;
}

export function BottomNavigation({ logo, products, flavor, section }: {
  logo: string; products: NavProduct[]; flavor?: string; section?: 'recipes' | 'articles';
}) {
  const nav = useRef<HTMLElement>(null);
  const [footerVisible, setFooterVisible] = useState(false);
  const pathname = usePathname();
  const current = products.find(product => product.slug === flavor) ?? products[0];
  const shortcuts = section ? [] : productShortcuts;

  useEffect(() => {
    const element = nav.current;
    const footer = document.getElementById('site-footer');
    if (!element || !footer) return;
    const closeMenus = () => element.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => { menu.open = false; });
    closeMenus();
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        closeMenus();
        if (element.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
      }
      setFooterVisible(entry.isIntersecting);
    });
    observer.observe(footer);
    const outside = (event: PointerEvent) => { if (!element.contains(event.target as Node)) closeMenus(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const open = element.querySelector<HTMLDetailsElement>('details[open]');
      if (open) { open.open = false; open.querySelector('summary')?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      observer.disconnect();
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [pathname]);

  const closeOnNavigate = (event: SyntheticEvent<HTMLElement>) => {
    if ((event.target as Element).closest('a')) nav.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => { menu.open = false; });
  };

  return (
    <nav ref={nav} className="site-nav" aria-label="منوی اصلی سایت" data-footer-visible={footerVisible} inert={footerVisible} onClick={closeOnNavigate}>
      <a className="site-nav__logo" href="/" aria-label="ات‌مت، صفحهٔ اصلی"><img src={logo} alt="" width={700} height={447} /></a>
      <div className="site-nav__links">
        {shortcuts.map(link => <a className={`site-nav__shortcut site-nav__shortcut--${link.icon}`} key={link.href} href={link.href}><NavIcon name={link.icon} /><span>{link.label}</span></a>)}
        {siteLinks.slice(2, 4).map(link => <a key={link.href} href={link.href} aria-current={section && link.href === `/${section}` ? 'page' : undefined}><NavIcon name={link.href === '/recipes' ? 'recipes' : 'articles'} /><span>{link.label}</span></a>)}
        {siteLinks.slice(4).map(link => <a className="site-nav__desktop" key={link.href} href={link.href}>{link.label}</a>)}
      </div>
      <details className="site-disclosure site-flavors">
        <summary aria-label={flavor ? `انتخاب طعم؛ طعم فعلی ${current.label}` : 'مشاهدهٔ محصولات و انتخاب طعم'} title="طعم‌های ات‌مت">
          <CanThumbnail product={current} /><svg className="site-disclosure__chevron" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m4 10 4-4 4 4" /></svg>
        </summary>
        <div className="site-disclosure__panel"><p className="site-disclosure__title">یه دنیا مزه.<span>طعم تو کدومه؟</span></p>
          <ul>{products.map(product => <li key={product.slug}><a href={`/flavors/${product.slug}`} aria-current={product.slug === flavor ? 'page' : undefined}><CanThumbnail product={product} /><span>{product.label}</span><span className="site-flavors__check" aria-hidden="true">{product.slug === flavor ? '✓' : '↖'}</span></a></li>)}</ul>
        </div>
      </details>
    </nav>
  );
}
