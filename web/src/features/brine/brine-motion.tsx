'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { INTRO_EVENT } from './can-choreography';
import { animateBrandEdges, animateCardStack } from './scroll-effects';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const ANCHORS = ['#details', '#nutrition', '#recipes', '#site-footer'];
const MOTION = '(prefers-reduced-motion: no-preference)';
const FINE = `(hover: hover) and (pointer: fine) and ${MOTION}`;
const CARD_STACK = '(max-width: 899px) and (min-height: 580px)';

export function BrineMotion({ children, staticMode = false, className = '', style, flavor }: { children: ReactNode; staticMode?: boolean; className?: string; style?: CSSProperties; flavor?: string }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    let frame = 0;
    document.fonts.ready.then(() => {
      if (!alive) return;
      frame = requestAnimationFrame(() => {
        const hash = window.location.hash;
        if (!alive || window.scrollY > 2 || !ANCHORS.includes(hash)) return;
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
        ScrollTrigger.refresh();
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  useGSAP(() => {
    const page = scope.current;
    if (staticMode || !page) return;
    const select = gsap.utils.selector(scope);
    const media = gsap.matchMedia();
    let alive = true;

    media.add(MOTION, () => {
      /* hero intro, played once the can hands off from the loader */
      const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
        .from(select('.b-hero [data-line]'), { yPercent: 115, duration: 1.5, stagger: 0.1 }, 0)
        .from(select('.b-nav'), { yPercent: -160, duration: 1.2 }, 0.2);
      const play = (delay: number) => { if (alive) intro.delay(delay).play(); };
      const pending = page.dataset.intro;
      const onIntro = (event: Event) => play((event as CustomEvent<{ delay: number }>).detail?.delay ?? 0);
      if (pending !== undefined) play(Number(pending) || 0);
      else window.addEventListener(INTRO_EVENT, onIntro, { once: true });

      select('[data-line]').forEach((line) => {
        if (line.closest('.b-hero')) return;
        gsap.from(line, {
          yPercent: 115,
          duration: 1.3,
          ease: 'expo.out',
          scrollTrigger: { trigger: line.parentElement, start: 'top 88%', once: true },
        });
      });

      select('[data-reveal]').forEach((node) => {
        gsap.from(node, {
          y: 44,
          autoAlpha: 0,
          duration: 1.2,
          ease: 'expo.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: node, start: 'top 88%', once: true },
        });
      });

      animateBrandEdges(page);

      const footerLogo = select('.b-footer__logo img')[0];
      if (footerLogo) {
        const heartbeat = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 2.2 })
          .to(footerLogo, { scale: 1.06, duration: 0.24, ease: 'power2.out' })
          .to(footerLogo, { scale: 1, duration: 0.24, ease: 'sine.inOut' })
          .to(footerLogo, { scale: 1.03, duration: 0.2, ease: 'sine.out' })
          .to(footerLogo, { scale: 1, duration: 0.4, ease: 'sine.inOut' });
        ScrollTrigger.create({
          // Measure the stable link, so the pulse cannot move its own trigger.
          // Let the entire logo arrive before the first beat.
          trigger: footerLogo.parentElement, start: 'bottom 92%', end: 'bottom top',
          onToggle: ({ isActive }) => { if (isActive) heartbeat.restart(); else heartbeat.pause(0); },
        });
      }

      /* nav: hide on the way down, return on the way up, mark the active section */
      const nav = select('[data-nav]')[0] as HTMLElement | undefined;
      if (nav) {
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => {
            const hide = self.direction === 1 && self.scroll() > window.innerHeight * 0.6;
            nav.classList.toggle('is-hidden', hide);
            nav.classList.toggle('is-solid', self.scroll() > window.innerHeight * 0.5);
          },
        });
        for (const id of ['details', 'recipes']) {
          const link = nav.querySelector<HTMLElement>(`[data-nav-link="${id}"]`);
          const section = document.getElementById(id);
          if (!link || !section) continue;
          ScrollTrigger.create({
            trigger: section,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: ({ isActive }) => {
              if (isActive) link.setAttribute('aria-current', 'true');
              else link.removeAttribute('aria-current');
            },
          });
        }
      }

      return () => {
        window.removeEventListener(INTRO_EVENT, onIntro);
      };
    });

    media.add({ motion: MOTION, stack: CARD_STACK }, ({ conditions }) => {
      const list = page.querySelector<HTMLOListElement>('.b-cards');
      if (!conditions?.motion || !list) return;
      return animateCardStack(list, !!conditions.stack, { card: '[data-card]', scroll: '.b-card__scroll', caption: 'figcaption' });
    });

    media.add(FINE, () => {
      const cleanups: Array<() => void> = [];

      (select('[data-magnetic]') as HTMLElement[]).forEach((node) => {
        const toX = gsap.quickTo(node, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        const toY = gsap.quickTo(node, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' });
        const move = (event: PointerEvent) => {
          const rect = node.getBoundingClientRect();
          toX((event.clientX - rect.left - rect.width / 2) * 0.3);
          toY((event.clientY - rect.top - rect.height / 2) * 0.35);
        };
        const leave = () => { toX(0); toY(0); };
        node.addEventListener('pointermove', move);
        node.addEventListener('pointerleave', leave);
        cleanups.push(() => {
          node.removeEventListener('pointermove', move);
          node.removeEventListener('pointerleave', leave);
        });
      });

      (select('[data-tilt]') as HTMLElement[]).forEach((node) => {
        gsap.set(node, { transformPerspective: 900 });
        const toRx = gsap.quickTo(node, 'rotationX', { duration: 0.7, ease: 'power3.out' });
        const toRy = gsap.quickTo(node, 'rotationY', { duration: 0.7, ease: 'power3.out' });
        const move = (event: PointerEvent) => {
          const rect = node.getBoundingClientRect();
          const nx = (event.clientX - rect.left) / rect.width - 0.5;
          const ny = (event.clientY - rect.top) / rect.height - 0.5;
          toRy(nx * 12);
          toRx(-ny * 10);
          node.style.setProperty('--gx', `${(nx + 0.5) * 100}%`);
          node.style.setProperty('--gy', `${(ny + 0.5) * 100}%`);
        };
        const leave = () => { toRx(0); toRy(0); };
        node.addEventListener('pointermove', move);
        node.addEventListener('pointerleave', leave);
        cleanups.push(() => {
          node.removeEventListener('pointermove', move);
          node.removeEventListener('pointerleave', leave);
        });
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    });

    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    return () => {
      alive = false;
      media.revert();
    };
  }, { scope, dependencies: [staticMode], revertOnUpdate: true });

  return (
    <div ref={scope} style={style} data-flavor={flavor} className={`b-page ${className}`} data-static={staticMode ? 'true' : 'false'} data-can={staticMode ? 'poster' : 'loading'}>
      {children}
    </div>
  );
}
