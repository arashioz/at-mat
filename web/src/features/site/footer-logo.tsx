'use client';

import { useEffect, useRef } from 'react';

export function FooterLogo({ src }: { src: string }) {
  const logo = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = logo.current;
    if (!link || new URLSearchParams(location.search).get('motion') === 'off') return;

    const visibility = new IntersectionObserver(([entry]) => {
      link.toggleAttribute('data-beating', entry.intersectionRatio >= .7);
    }, { threshold: .7 });
    visibility.observe(link);
    return () => { visibility.disconnect(); delete link.dataset.beating; };
  }, []);

  return (
    <a ref={logo} className="b-footer__logo" href="/" aria-label="ات‌مت، صفحهٔ اصلی">
      <img src={src} alt="" width={700} height={447} loading="lazy" />
    </a>
  );
}
