'use client';

import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { usePathname } from 'next/navigation';
import { CanArtwork } from '@/features/products/can-artwork';
import { NavIcon } from './nav-icons';
import { siteLinks, type SiteSection } from './site-links';

type NavProduct = { slug: string; label: string; wrap: string; lid: string };

const productShortcuts = [
  { href: '#details', label: 'مشخصات', icon: 'details' },
  { href: '#recipes', label: 'ایدهٔ سرو', icon: 'serving' },
] as const;

const homeShortcuts = [{ href: '#products', label: 'محصولات', icon: 'products' }] as const;

function CanThumbnail({ product }: { product: NavProduct }) {
  return <CanArtwork className="site-can" wrap={product.wrap} lid={product.lid} />;
}

export function BottomNavigation({ logo, products, flavor, section }: {
  logo: string; products: NavProduct[]; flavor?: string; section?: SiteSection;
}) {
  const nav = useRef<HTMLElement>(null);
  const [activeShortcut, setActiveShortcut] = useState<string>();
  const pathname = usePathname();
  const current = products.find(product => product.slug === flavor) ?? products[0];
  const shortcuts = section === 'home' ? homeShortcuts : productShortcuts;
  const productPath = section && section !== 'home' ? `/flavors/${current.slug}` : '';

  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const footer = document.getElementById('site-footer');
    const closeMenus = () => element.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => { menu.open = false; });
    closeMenus();
    let footerObserver: IntersectionObserver | undefined;
    const observeFooter = () => {
      if (!footer) return;
      footerObserver?.disconnect();
      const bottom = Number.parseFloat(getComputedStyle(element).insetBlockEnd) || 0;
      const overlap = Math.max(0, Math.round(element.offsetHeight + bottom - 12));
      footerObserver = new IntersectionObserver(([entry]) => {
        element.toggleAttribute('data-at-footer', entry.isIntersecting);
        if (entry.isIntersecting) closeMenus();
      }, { rootMargin: `0px 0px -${overlap}px 0px` });
      footerObserver.observe(footer);
    };
    const resize = new ResizeObserver(observeFooter);
    if (footer) {
      observeFooter();
      resize.observe(element);
    }
    const outside = (event: PointerEvent) => { if (!element.contains(event.target as Node)) closeMenus(); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const open = element.querySelector<HTMLDetailsElement>('details[open]');
      if (open) { open.open = false; open.querySelector('summary')?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      resize.disconnect();
      footerObserver?.disconnect();
      delete element.dataset.atFooter;
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [pathname]);

  useEffect(() => {
    if (productPath) return;
    const targets = shortcuts.flatMap(({ href }) => {
      const element = document.getElementById(href.slice(1));
      return element ? [{ href, element }] : [];
    });
    let frame = 0;
    function updateShortcut() {
      frame = 0;
      const readingLine = window.innerHeight * .3;
      setActiveShortcut(targets.find(({ element }) => {
        const { top, bottom } = element.getBoundingClientRect();
        return top <= readingLine && bottom > readingLine;
      })?.href);
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateShortcut);
    }
    updateShortcut();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [pathname, productPath, shortcuts]);

  const closeOnNavigate = (event: SyntheticEvent<HTMLElement>) => {
    if ((event.target as Element).closest('a')) nav.current?.querySelectorAll<HTMLDetailsElement>('details[open]').forEach(menu => { menu.open = false; });
  };

  return (
    <nav ref={nav} className="site-nav" aria-label="منوی اصلی سایت" onClick={closeOnNavigate}>
      <a className="site-nav__logo" href="/" aria-label="ات‌مت، صفحهٔ اصلی" aria-current={section === 'home' ? 'page' : undefined}><img src={logo} alt="" width={700} height={447} /></a>
      <div className="site-nav__links">
        {shortcuts.map(link => <a key={link.href} href={productPath + link.href} aria-current={!productPath && activeShortcut === link.href ? 'location' : undefined}>
          <NavIcon name={link.icon} /><span>{link.label}</span>
        </a>)}
        {siteLinks.slice(2, 4).map(link => <a key={link.href} href={link.href} aria-current={section && link.href === `/${section}` ? 'page' : undefined}><NavIcon name={link.href === '/recipes' ? 'recipes' : 'articles'} /><span>{link.label}</span></a>)}
        {siteLinks.slice(4).map(link => <a className="site-nav__desktop" key={link.href} href={link.href} aria-current={link.href === pathname ? 'page' : undefined}>{link.label}</a>)}
      </div>
      <details className="site-disclosure site-flavors">
        <summary aria-label={flavor ? `انتخاب طعم، طعم فعلی ${current.label}` : 'مشاهدهٔ محصولات و انتخاب طعم'}>
          <CanThumbnail product={current} />
          <span className="site-flavors__label">طعم‌ها <svg className="site-disclosure__chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m4 10 4-4 4 4" /></svg></span>
        </summary>
        <div className="site-disclosure__panel">
          <p className="site-disclosure__title">طعم‌های ات‌مت<span>طعم بعدی را انتخاب کن.</span></p>
          <ul>{products.map(product => <li key={product.slug}>
            <a href={`/flavors/${product.slug}`} aria-current={product.slug === flavor ? 'page' : undefined}>
              <CanThumbnail product={product} /><span>{product.label}</span>
              <span className="site-flavors__check" aria-hidden="true">{product.slug === flavor ? '✓' : ''}</span>
            </a>
          </li>)}</ul>
        </div>
      </details>
    </nav>
  );
}
