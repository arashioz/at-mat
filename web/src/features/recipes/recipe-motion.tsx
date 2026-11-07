'use client';

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { animateBrandEdges, animateCardStack } from '../brine/scroll-effects';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function RecipeMotion({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(() => {
    const page = root.current;
    if (!page || new URLSearchParams(location.search).get('motion') === 'off') return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lines = page.querySelectorAll('[data-recipe-line]');
      const photos = page.querySelectorAll('[data-recipe-photo]');
      const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
      if (lines.length) intro.from(lines, { yPercent: 115, duration: 1, stagger: 0.1 }, 0.1);
      if (photos.length) intro.from(photos, { y: 24, opacity: 0, duration: 1.1 }, 0.18);
      animateBrandEdges(page);
      const nav = page.querySelector('.r-nav');
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: self => nav?.classList.toggle('is-hidden', self.direction > 0 && self.scroll() > 180) });
      const logo = page.querySelector('.r-footer__brand img');
      if (logo) {
        const pulse = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.2 })
          .to(logo, { scale: 1.05, duration: 0.24, ease: 'power2.out' })
          .to(logo, { scale: 1, duration: 0.24, ease: 'sine.inOut' })
          .to(logo, { scale: 1.025, duration: 0.2, ease: 'sine.out' })
          .to(logo, { scale: 1, duration: 0.4, ease: 'sine.inOut' });
        ScrollTrigger.create({ trigger: logo.parentElement, start: 'top 80%', end: 'bottom top', onToggle: self => self.isActive ? pulse.restart() : pulse.pause(0) });
      }
    });
    media.add({ motion: '(prefers-reduced-motion: no-preference)', stack: '(max-width: 899px) and (min-height: 580px)' }, ({ conditions }) => {
      const list = page.querySelector<HTMLElement>('[data-related-cards]');
      if (!conditions?.motion || !list) return;
      return animateCardStack(list, !!conditions.stack, { card: '.r-related-card', scroll: '.r-related-card__scroll', caption: '.r-card__content' });
    });
    let alive = true;
    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    return () => { alive = false; media.revert(); page.querySelector('.r-nav')?.classList.remove('is-hidden'); };
  }, { scope: root, dependencies: [pathname], revertOnUpdate: true });

  useEffect(() => {
    const page = root.current;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    if (!page || preference.matches || new URLSearchParams(location.search).get('motion') === 'off') return;
    const seen = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const animation = entry.target.animate([{ opacity: 0, transform: 'translateY(32px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 800, easing: 'cubic-bezier(.16,1,.3,1)' });
        animations.add(animation);
        animation.finished.then(() => animations.delete(animation)).catch(() => {});
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    const observe = () => page.querySelectorAll('[data-recipe-reveal]').forEach(node => { if (!seen.has(node)) { seen.add(node); observer.observe(node); } });
    observe();
    const mutation = new MutationObserver(observe);
    mutation.observe(page, { childList: true, subtree: true });
    const cancel = () => { if (preference.matches) { observer.disconnect(); animations.forEach(animation => animation.cancel()); } };
    preference.addEventListener('change', cancel);
    return () => { observer.disconnect(); mutation.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener('change', cancel); };
  }, [pathname]);
  return <div className={`r-site ${className}`} ref={root} style={style}>{children}</div>;
}
