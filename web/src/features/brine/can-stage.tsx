'use client';

import { useRef, type CSSProperties } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { BrineCurrent } from './brine-current';
import { WeightBadge } from './weight-badge';
import { buildJourney, INTRO_EVENT, mixPose, topPose, type CanPose, type CanSlot } from './can-choreography';
import type { CanScene } from './can-scene';
import type { BrineImage } from './types';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const COMPACT = '(max-width: 899px), (max-height: 639px)';
const FINE = '(hover: hover) and (pointer: fine)';
const TURN = Math.PI * 2;
const MIN_LOADER_MS = 1300;
const LOAD_TIMEOUT_MS = 15000;
const digits = new Intl.NumberFormat('fa-IR');

type CanMode = 'loading' | 'live' | 'poster';

function slotOf(element: Element | null, offsetY = 0): CanSlot | null {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 + offsetY, d: rect.width };
}

export function CanStage({ wrap, wrapSmall, lid, staticMode, netWeight, lightColor }: { netWeight: string; lightColor: readonly [number, number, number]; wrap: BrineImage; wrapSmall: BrineImage; lid: BrineImage; staticMode: boolean }) {
  const layer = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const loader = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const badgeMotion = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = layer.current;
    const canvasHost = host.current;
    const loaderEl = loader.current;
    const page = root?.closest<HTMLElement>('.b-page');
    if (!root || !canvasHost || !loaderEl || !page) return;
    const html = document.documentElement;
    const announce = (delay: number) => {
      page.dataset.intro = String(delay);
      window.dispatchEvent(new CustomEvent(INTRO_EVENT, { detail: { delay } }));
    };
    const setMode = (mode: CanMode) => { page.dataset.can = mode; };
    const unlock = () => html.classList.remove('is-loading');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (staticMode || reduce.matches) {
      setMode('poster');
      loaderEl.hidden = true;
      announce(0);
      return;
    }

    loaderEl.hidden = false;
    delete page.dataset.intro;
    setMode('loading');
    html.classList.add('is-loading');
    let alive = true;
    let scene: CanScene | null = null;
    let journey = buildJourney({ hero: { x: 0, y: 0, d: 1 }, stage: { x: 0, y: 0, d: 1 }, detailTop: 1 });
    const intro = { t: 0, from: null as CanPose | null };
    let introTimeline: gsap.core.Timeline | null = null;
    const display = { p: 0 };
    let dragging = false;
    let detailTop = Infinity;
    let badgeShown = false;
    const badgeEl = badge.current;
    const badgeMotionEl = badgeMotion.current;
    let badgeTween: gsap.core.Tween | null = null;
    const positionBadgeX = badgeEl ? gsap.quickSetter(badgeEl, 'x', 'px') : null;
    const positionBadgeY = badgeEl ? gsap.quickSetter(badgeEl, 'y', 'px') : null;

    const syncBadge = (pose: CanPose, gone: boolean) => {
      if (!badgeEl || !badgeMotionEl) return;
      // This HTML sticker stays over the lower right of the label, clear of the logo.
      const halfWidth = badgeEl.offsetWidth / 2;
      const x = pose.x + pose.d * (0.35 + (scene?.offsets.px ?? 0) * 0.025);
      positionBadgeX?.(Math.min(window.innerWidth - halfWidth - 12, Math.max(halfWidth + 12, x)));
      positionBadgeY?.(pose.y + pose.d * 0.2);
      const show = !gone && intro.t >= 1 && window.scrollY >= detailTop - 0.5
        && pose.y >= Math.max(100, pose.d * 0.3);
      if (show === badgeShown) return;
      badgeShown = show;
      badgeTween?.kill();
      badgeTween = show
        ? gsap.fromTo(badgeMotionEl, { autoAlpha: 0, y: 16, scale: 0.9 }, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out',
        })
        : gsap.to(badgeMotionEl, { autoAlpha: 0, y: -20, scale: 0.96, duration: 0.3, ease: 'power2.in' });
    };

    const drawProgress = () => {
      if (count.current) count.current.textContent = digits.format(Math.round(display.p * 100));
      if (ring.current) ring.current.style.strokeDashoffset = String(1 - display.p);
    };
    const setProgress = (p: number, duration = 0.6) => gsap.to(display, { p: Math.max(display.p, p), duration, ease: 'power2.out', overwrite: true, onUpdate: drawProgress });

    const paint = () => {
      if (!scene) return;
      const { pose: target, tilt } = journey.sample(window.scrollY);
      const from = intro.t < 1 ? intro.from : null;
      const pose = from
        ? { ...mixPose(from, target, intro.t), yaw: target.yaw - (1 - intro.t) * TURN }
        : target;
      scene.setPose(pose, from ? undefined : tilt);
      const gone = pose.alpha < 0.01 || window.scrollY >= journey.end;
      root.classList.toggle('is-gone', gone);
      scene.setVisible(!gone);
      scene.render();
      syncBadge(pose, gone);
    };

    const measure = () => {
      const detail = document.getElementById('details');
      const heroSlot = slotOf(document.querySelector('[data-can-slot="hero"]'), window.scrollY);
      const stageSlotEl = document.querySelector('[data-can-slot="stage"]');
      if (!detail || !heroSlot || !stageSlotEl) return;
      const detailRect = detail.getBoundingClientRect();
      const anchor = stageSlotEl.getBoundingClientRect();
      detailTop = detailRect.top + window.scrollY;
      journey = buildJourney({
        hero: heroSlot,
        stage: { x: anchor.left + anchor.width / 2, y: anchor.top - detailRect.top + anchor.height / 2, d: anchor.width },
        detailTop,
      });
    };

    let scrollTrigger: ScrollTrigger | null = null;
    const startJourney = () => {
      measure();
      // The approach is eased inside the trajectory. Reading native scroll here
      // keeps the landed can attached to its document slot, even on fast swipes.
      scrollTrigger = ScrollTrigger.create({
        start: 0,
        end: () => journey.end,
        onUpdate: paint,
        onRefresh: paint,
      });
      ScrollTrigger.addEventListener('refreshInit', measure);
      ScrollTrigger.refresh();
    };

    /* idle float while the hero is in view */
    const bob = { v: 0 };
    const tick = () => {
      if (!scene || intro.t < 1) return;
      // Fade idle float out as soon as the journey starts; scroll owns the pose.
      const target = dragging ? 0 : Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.12));
      bob.v += (target - bob.v) * 0.06;
      scene.offsets.bob = bob.v;
      if (bob.v > 0.002) scene.render();
    };

    /* pointer: parallax and drag-to-spin */
    const fine = window.matchMedia(FINE);
    const pointer = { x: -1, y: -1, last: 0, time: 0, velocity: 0 };
    const parallax = { x: 0, y: 0 };
    const syncParallax = () => {
      if (!scene) return;
      scene.offsets.px = parallax.x;
      scene.offsets.py = parallax.y;
      scene.render();
      syncBadge(scene.pose, scene.pose.alpha < 0.01 || window.scrollY >= journey.end);
    };
    const toPx = gsap.quickTo(parallax, 'x', { duration: 1.2, ease: 'power3.out', onUpdate: syncParallax });
    const toPy = gsap.quickTo(parallax, 'y', { duration: 1.2, ease: 'power3.out', onUpdate: syncParallax });

    const hit = (x: number, y: number) => {
      if (!scene || intro.t < 1) return false;
      const p = scene.pose;
      return p.alpha > 0.5 && Math.hypot(x - p.x, (y - p.y) * 1.25) < p.d * 0.58;
    };
    const hover = (over: boolean) => {
      html.classList.toggle('is-grab', over && !dragging);
    };
    const grab = (x: number) => {
      if (!scene) return;
      dragging = true;
      pointer.last = x;
      pointer.time = performance.now();
      pointer.velocity = 0;
      gsap.killTweensOf(scene.offsets, 'spin');
      html.classList.add('is-grabbing');
    };
    const dragTo = (x: number) => {
      if (!scene || !dragging) return;
      const now = performance.now();
      const dx = x - pointer.last;
      pointer.velocity = dx / Math.max(8, now - pointer.time);
      pointer.last = x;
      pointer.time = now;
      scene.offsets.spin += dx * (6 / Math.max(240, scene.pose.d));
      scene.render();
    };
    const release = () => {
      if (!scene || !dragging) return;
      dragging = false;
      html.classList.remove('is-grabbing');
      hover(hit(pointer.x, pointer.y));
      const current = scene.offsets.spin;
      const flung = current + gsap.utils.clamp(-3, 3, pointer.velocity) * 1.6;
      const target = Math.round(flung / TURN) * TURN;
      const live = scene;
      gsap.to(live.offsets, { spin: target, duration: 1.4 + Math.abs(target - current) * 0.08, ease: 'power3.out', onUpdate: () => live.render() });
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (dragging) dragTo(event.clientX);
      else hover(hit(event.clientX, event.clientY));
      if (fine.matches) {
        toPx((event.clientX / window.innerWidth) * 2 - 1);
        toPy((event.clientY / window.innerHeight) * 2 - 1);
      }
    };
    const onPointerLeave = () => {
      pointer.x = -1;
      pointer.y = -1;
      hover(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;
      if (!hit(event.clientX, event.clientY)) return;
      event.preventDefault();
      grab(event.clientX);
    };
    const onScrollHover = () => {
      if (!dragging && pointer.x >= 0) hover(hit(pointer.x, pointer.y));
    };

    const touch = { x: 0, y: 0, armed: false, decided: false };
    const onTouchStart = (event: TouchEvent) => {
      const point = event.touches[0];
      touch.armed = event.touches.length === 1 && !!point && hit(point.clientX, point.clientY);
      touch.decided = false;
      if (point) {
        touch.x = point.clientX;
        touch.y = point.clientY;
      }
    };
    const onTouchMove = (event: TouchEvent) => {
      const point = event.touches[0];
      if (!touch.armed || !point) return;
      if (!touch.decided) {
        const dx = point.clientX - touch.x;
        const dy = point.clientY - touch.y;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        touch.decided = true;
        if (Math.abs(dx) <= Math.abs(dy)) {
          touch.armed = false;
          return;
        }
        grab(touch.x);
      }
      event.preventDefault();
      dragTo(point.clientX);
    };
    const onTouchEnd = () => {
      touch.armed = false;
      release();
    };

    const listen = () => {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      html.addEventListener('pointerleave', onPointerLeave);
      window.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointerup', release);
      window.addEventListener('pointercancel', release);
      window.addEventListener('scroll', onScrollHover, { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('touchcancel', onTouchEnd);
      gsap.ticker.add(tick);
    };

    const fail = () => {
      if (!alive) return;
      introTimeline?.kill();
      badgeTween?.kill();
      badgeShown = false;
      if (badgeMotionEl) gsap.set(badgeMotionEl, { autoAlpha: 0, y: 16, scale: 0.9 });
      scene?.dispose();
      scene = null;
      setMode('poster');
      unlock();
      gsap.to(loaderEl, { autoAlpha: 0, duration: 0.5, onComplete: () => { loaderEl.hidden = true; } });
      announce(0.1);
    };

    const runIntro = (live: CanScene) => {
      const lidEl = loaderEl.querySelector('.b-loader__lid');
      const from = slotOf(lidEl);
      intro.from = from ? topPose(from) : topPose(journey.hero);
      intro.t = 0;
      // Paint the matched lid before swapping the CSS loader for the canvas.
      paint();
      live.render(true);
      setMode('live');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!alive || scene !== live) return;
        introTimeline = gsap.timeline()
          .set(lidEl, { autoAlpha: 0 })
          .to(loaderEl.querySelectorAll('.b-loader__ui'), { autoAlpha: 0, duration: 0.35, ease: 'power2.out' }, 0)
          .to(intro, { t: 1, duration: 2.3, ease: 'expo.inOut', onUpdate: paint }, 0.12)
          .to(loaderEl.querySelector('.b-loader__bg'), { autoAlpha: 0, duration: 1.1, ease: 'power2.inOut' }, 0.5)
          .call(() => { unlock(); announce(0); }, undefined, 0.95)
          .call(() => { loaderEl.hidden = true; live.render(); }, undefined, 2.45);
      }));
    };

    async function start() {
      const began = performance.now();
      const compact = window.matchMedia(COMPACT).matches;
      const timeout = window.setTimeout(fail, LOAD_TIMEOUT_MS);
      try {
        setProgress(0.06, 0.4);
        const { createCanScene } = await import('./can-scene');
        if (!alive) return;
        setProgress(0.12, 0.4);
        const next = createCanScene(canvasHost!, { wrap: (compact ? wrapSmall : wrap).url, lid: lid.url }, {
          compact,
          onProgress: (loaded) => setProgress(0.12 + loaded * 0.8),
          onContextLost: fail,
        });
        scene = next;
        await next.ready;
        if (!alive) return;
        window.clearTimeout(timeout);
        const wait = MIN_LOADER_MS - (performance.now() - began);
        if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
        await new Promise<void>((resolve) => { setProgress(1, 0.5).eventCallback('onComplete', () => resolve()); });
        if (!alive) return;
        startJourney();
        listen();
        runIntro(next);
        if (process.env.NODE_ENV === 'development') (window as unknown as { __brineCan?: CanScene }).__brineCan = next;
      } catch {
        window.clearTimeout(timeout);
        fail();
      }
    }

    const preference = () => { if (reduce.matches) fail(); };
    reduce.addEventListener('change', preference);
    void start();

    return () => {
      alive = false;
      introTimeline?.revert();
      badgeTween?.kill();
      if (badgeMotionEl) gsap.set(badgeMotionEl, { clearProps: 'all' });
      if (badgeEl) gsap.set(badgeEl, { clearProps: 'transform' });
      reduce.removeEventListener('change', preference);
      ScrollTrigger.removeEventListener('refreshInit', measure);
      scrollTrigger?.kill();
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onPointerMove);
      html.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('scroll', onScrollHover);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
      html.classList.remove('is-loading', 'is-grab', 'is-grabbing');
      if (scene) gsap.killTweensOf(scene.offsets);
      scene?.dispose();
      scene = null;
    };
  }, { dependencies: [staticMode, wrap.url, wrapSmall.url, lid.url], revertOnUpdate: true });

  return (
    <>
      <div ref={loader} className="b-loader" aria-hidden="true">
        <div className="b-loader__bg"><BrineCurrent phase="loader" staticMode={staticMode} lightColor={lightColor} /></div>
        <div className="b-loader__lid" style={{ '--lid': `url("${lid.url}")` } as CSSProperties}>
          <svg className="b-loader__ring b-loader__ui" viewBox="0 0 100 100" aria-hidden="true">
            <circle className="b-loader__track" cx="50" cy="50" r="48" pathLength={1} />
            <circle ref={ring} className="b-loader__bar" cx="50" cy="50" r="48" pathLength={1} />
          </svg>
        </div>
        <p className="b-loader__count b-loader__ui"><span ref={count}>۰</span><small>٪</small></p>
      </div>
      <div ref={layer} className="b-can">
        <div ref={host} className="b-can__canvas" />
        <div ref={badge} className="b-can__badge" aria-hidden="true">
          <div ref={badgeMotion} className="b-can__badge-motion"><WeightBadge weight={netWeight} /></div>
        </div>
      </div>
    </>
  );
}
