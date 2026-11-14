'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { BrandEdge } from '@/features/brine/brand-edge';
import type { BrineImage } from '@/features/brine/types';
import type { FlavorTheme } from '@/features/products/types';
import { CanLid } from './can-lid';
import { ShowcaseDoodles, showcaseColor, showcasePalette } from './showcase-doodles';
import { clamp, coastClearPoint, coastPose, ease, reelPoses, roll } from './showcase-motion';
import './home-hero.css';

export interface HomeHeroFlavor {
  slug: string;
  label: string;
  name: string;
  headline: readonly string[];
  netWeight: string;
  drainedWeight?: string;
  lid: BrineImage;
  artwork?: BrineImage;
  theme: Pick<FlavorTheme, 'pale'>;
}

// Mixkit Stock Video Free License: https://mixkit.co/free-stock-video/waves-coming-to-the-beach-5016/
const coastClip = '/media/branding/atmat-home-coast.mp4';
const stillPreference = '(prefers-reduced-motion: reduce), (max-height: 520px)';
const sceneProperties = [
  '--can-center', '--coast-line', '--coast-drop', '--coast-drift', '--coast-paper',
  '--title-opacity', '--cue-opacity', '--stage-enter', '--panel-out', '--panel-in',
  '--copy-out', '--copy-in', '--copy-shift', '--ink-x', '--ink-y', '--exit',
];
const sceneAttributes = [
  'data-animated', 'data-coast-cleared', 'data-coast-past', 'data-title-past', 'data-cue-past', 'data-stage-visible',
];

function FlavorFacts({ flavor }: { flavor: HomeHeroFlavor }) {
  return (
    <dl className="home-hero__facts">
      <div><dt>وزن خالص</dt><dd>{flavor.netWeight}<span> گرم</span></dd></div>
      {flavor.drainedWeight && <div><dt>وزن آبکش</dt><dd>{flavor.drainedWeight}</dd></div>}
    </dl>
  );
}

function flavorHref(slug: string, staticMode: boolean) {
  const path = '/flavors/' + slug;
  return staticMode ? path + '?motion=off' : path;
}

function StillFlavors({ flavors, staticMode }: { flavors: HomeHeroFlavor[]; staticMode: boolean }) {
  return (
    <section className="home-hero__still-flavors" id="home-flavor-list" aria-labelledby="home-flavor-title">
      <div className="home-wrap">
        <h2 id="home-flavor-title">طعم‌های ات‌مت</h2>
        <ul>
          {flavors.map(flavor => (
            <li key={flavor.slug} style={{ '--flavor-color': showcaseColor(flavor.slug), '--flavor-ink': flavor.theme.pale } as CSSProperties}>
              <Link href={flavorHref(flavor.slug, staticMode)} prefetch={false} aria-label={'مشاهدهٔ ' + flavor.name}>
                <div className="home-hero__still-lid"><CanLid image={flavor.lid} /></div>
                <h3>{flavor.label}</h3>
              </Link>
              <FlavorFacts flavor={flavor} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function HomeHero({ flavors, logo, coast, staticMode }: {
  flavors: HomeHeroFlavor[]; logo: BrineImage; coast?: BrineImage; staticMode: boolean;
}) {
  const section = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const coastLength = useRef<HTMLDivElement>(null);
  const flavorLength = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLSpanElement>(null);
  const landing = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const pausedByVisitor = useRef(false);
  const [artChapter, setArtChapter] = useState(-1);
  const [onCoast, setOnCoast] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const first = flavors[0];

  useEffect(() => {
    const root = section.current;
    const frame = scene.current;
    const intro = coastLength.current;
    const beat = flavorLength.current;
    const start = origin.current;
    const end = landing.current;
    if (!root || !frame || !intro || !beat || !start || !end || staticMode) return;

    const preference = window.matchMedia(stillPreference);
    const cans = [...frame.querySelectorAll<HTMLAnchorElement>('[data-reel-slot]')];
    const captions = [...frame.querySelectorAll<HTMLElement>('[data-flavor-caption]')];
    const panels = [...frame.querySelectorAll<HTMLElement>('[data-flavor-panel]')];
    const count = flavors.length;
    const measure = () => {
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      const diameter = cans[0].offsetWidth;
      const originY = start.offsetTop;
      const landingY = end.offsetTop;
      const openingScale = Number(getComputedStyle(root).getPropertyValue('--opening-scale'));
      const coast = Math.max(1, intro.getBoundingClientRect().height);
      const flavor = Math.max(1, beat.getBoundingClientRect().height);
      const closing = height * .67;
      const shoreStart = originY + diameter * .22 + 20;
      const shoreClear = Math.max(height * .76, originY + diameter * .52 + 38);
      return { width, diameter, originY, landingY, openingScale, coast, flavor, closing, shoreStart, shoreClear };
    };

    let animationFrame = 0;
    let lastScroll = -1;
    let lastChapter = -1;
    let lastCaption = -1;
    let lastArtChapter = -1;
    let wasOnCoast = true;
    let sizeChanged = true;
    let metrics: ReturnType<typeof measure>;

    function render() {
      animationFrame = 0;
      if (!root) return;
      if (sizeChanged) {
        metrics = measure();
        sizeChanged = false;
      }

      const release = metrics.coast + metrics.flavor * count;
      const exitStart = release - metrics.closing * .08;
      const scroll = Math.max(0, Math.min(exitStart + metrics.closing, -root.getBoundingClientRect().top));
      if (scroll === lastScroll) return;
      lastScroll = scroll;

      const opening = clamp(scroll / metrics.coast);
      const introPose = coastPose(opening);
      const flavorProgress = Math.max(0, (scroll - metrics.coast) / metrics.flavor);
      const chapter = Math.min(count - 1, Math.floor(flavorProgress));
      const next = Math.min(count - 1, chapter + 1);
      const progress = clamp(flavorProgress - chapter);
      const exchange = chapter === next ? 0 : roll(clamp((progress - .20) / .80));
      // Keep the last can moving while the scene unpins and the story enters below it.
      const exitProgress = clamp((scroll - exitStart) / metrics.closing);
      const leaving = exitProgress ** 1.6;
      const canCenter = metrics.originY + (metrics.landingY - metrics.originY) * introPose.descent;
      const shoreY = metrics.shoreStart + (metrics.shoreClear - metrics.shoreStart) * introPose.drop
        - (metrics.shoreClear + 56) * introPose.lift;
      const copySwitch = .5;
      const copyOut = 1 - ease(clamp((exchange - .11) / (copySwitch - .11)));
      const copyIn = ease(clamp((exchange - copySwitch) / .36));
      const caption = exchange < copySwitch ? chapter : next;
      const poses = reelPoses({
        chapter, exchange, leaving, entry: introPose.stage,
        count, width: metrics.width, diameter: metrics.diameter,
      });

      root.style.setProperty('--can-center', canCenter + 'px');
      root.style.setProperty('--coast-line', shoreY + 'px');
      root.style.setProperty('--coast-drop', String(introPose.descent));
      root.style.setProperty('--coast-drift', Math.sin(opening * Math.PI) * 12 + 'px');
      root.style.setProperty('--coast-paper', String(introPose.paper));
      root.style.setProperty('--title-opacity', String(introPose.title));
      root.style.setProperty('--cue-opacity', String(introPose.cue));
      root.style.setProperty('--stage-enter', String(introPose.stage));
      root.style.setProperty('--panel-out', metrics.width * exchange + 'px');
      root.style.setProperty('--panel-in', metrics.width * (exchange - 1) + 'px');
      root.style.setProperty('--copy-out', String(copyOut));
      root.style.setProperty('--copy-in', String(copyIn));
      root.style.setProperty('--copy-shift', String(exchange));
      root.style.setProperty('--ink-x', Math.sin(progress * 2 * Math.PI) * 8 + 'px');
      root.style.setProperty('--ink-y', (Math.sin(progress * Math.PI) * 8 - (1 - introPose.stage) * 8) + 'px');
      root.style.setProperty('--exit', String(ease(clamp((exitProgress - .13) / .87))));
      root.toggleAttribute('data-coast-cleared', opening >= coastClearPoint);
      root.toggleAttribute('data-coast-past', opening === 1);
      root.toggleAttribute('data-title-past', introPose.title === 0);
      root.toggleAttribute('data-cue-past', introPose.cue === 0);
      root.toggleAttribute('data-stage-visible', introPose.stage > 0 && exitProgress < 1);

      for (const [index, node] of cans.entries()) {
        let pose = poses.get(index);
        if (index === 0 && opening < 1) {
          const size = metrics.openingScale + (1 - metrics.openingScale) * introPose.descent;
          pose = { x: 0, turn: introPose.turn, size, opacity: 1 };
        }

        const visible = pose && pose.opacity > .003 &&
          Math.abs(pose.x) < (metrics.width + metrics.diameter * pose.size) / 2;
        node.toggleAttribute('data-on-reel', Boolean(visible));
        if (!pose) continue;
        node.style.setProperty('--reel-x', pose.x + 'px');
        node.style.setProperty('--reel-turn', pose.turn + 'deg');
        node.style.setProperty('--reel-size', String(pose.size));
        node.style.setProperty('--reel-opacity', String(pose.opacity));
      }

      if (chapter !== lastChapter) {
        lastChapter = chapter;
        for (const group of [captions, panels]) {
          group.forEach((node, index) => {
            node.toggleAttribute('data-from', index === chapter);
            node.toggleAttribute('data-to', index === next && chapter !== next);
          });
        }
      }
      const visibleCaption = introPose.stage > 0 && exitProgress < 1 ? caption : -1;
      if (visibleCaption !== lastCaption) {
        lastCaption = visibleCaption;
        captions.forEach((node, index) => node.setAttribute('aria-hidden', String(index !== visibleCaption)));
      }

      if (opening >= .48 && chapter !== lastArtChapter) {
        lastArtChapter = chapter;
        setArtChapter(chapter);
      }

      const coastInView = shoreY > 0;
      if (wasOnCoast !== coastInView) {
        wasOnCoast = coastInView;
        setOnCoast(coastInView);
      }
    }

    const schedule = () => {
      if (!animationFrame) animationFrame = requestAnimationFrame(render);
    };
    const resize = new ResizeObserver(() => {
      sizeChanged = true;
      lastScroll = -1;
      schedule();
    });
    const stop = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      sceneAttributes.forEach(attribute => root.removeAttribute(attribute));
      sceneProperties.forEach(property => root.style.removeProperty(property));
      for (const node of cans) {
        delete node.dataset.onReel;
        node.removeAttribute('style');
      }
      for (const node of [...captions, ...panels]) {
        delete node.dataset.from;
        delete node.dataset.to;
      }
      for (const node of captions) node.setAttribute('aria-hidden', 'true');
      lastChapter = -1;
      lastCaption = -1;
      lastScroll = -1;
    };
    const sync = () => {
      stop();
      if (preference.matches) return;
      sizeChanged = true;
      root.dataset.animated = '';
      render();
      resize.observe(frame);
      resize.observe(intro);
      resize.observe(beat);
      window.addEventListener('scroll', schedule, { passive: true });
    };
    sync();
    preference.addEventListener('change', sync);
    return () => {
      preference.removeEventListener('change', sync);
      stop();
    };
  }, [flavors, staticMode]);

  useEffect(() => {
    const clip = video.current;
    if (!clip || !videoAvailable || staticMode) return;
    if (!onCoast) {
      clip.pause();
      return;
    }

    const preference = window.matchMedia(stillPreference);
    let visible = false;
    const sync = () => {
      if (visible && !preference.matches && !pausedByVisitor.current) {
        void clip.play().catch(() => {});
      } else {
        clip.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(clip);
    preference.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', sync);
      clip.pause();
    };
  }, [onCoast, staticMode, videoAvailable]);

  function toggleVideo() {
    const clip = video.current;
    if (!clip) return;
    pausedByVisitor.current = !clip.paused;
    if (clip.paused) void clip.play().catch(() => {});
    else clip.pause();
  }

  function showProducts(event: MouseEvent<HTMLButtonElement>) {
    const root = section.current;
    const length = coastLength.current;
    if (!root || !length) return;
    const top = window.scrollY + root.getBoundingClientRect().top;
    if (event.detail === 0) {
      scene.current?.querySelector<HTMLAnchorElement>('[data-reel-slot="0"]')?.focus({ preventScroll: true });
    }
    window.scrollTo({ top: top + Math.ceil(length.getBoundingClientRect().height), behavior: 'smooth' });
  }

  return (
    <section id="products" className="home-hero" ref={section} aria-labelledby="home-title" data-static={staticMode || undefined}
      style={{ '--coast-floor': showcaseColor(first.slug), '--flavor-count': flavors.length } as CSSProperties}>
      <div className="home-hero__scene" ref={scene}>
        <div className="home-hero__coast" aria-hidden="true">
          {coast && <img className="home-hero__sea" src={coast.url} width={coast.width} height={coast.height} alt="" fetchPriority="high" />}
          {!staticMode && videoAvailable && (
            <video className="home-hero__video" ref={video} src={coastClip} poster={coast?.url}
              muted loop playsInline preload="none" aria-hidden="true"
              onPlay={() => setVideoPlaying(true)} onPause={() => setVideoPlaying(false)}
              onError={() => setVideoAvailable(false)} />
          )}
        </div>
        <header className="home-wrap home-hero__masthead">
          <img src={logo.url} alt={logo.alt} width={logo.width} height={logo.height} />
          <div className="home-hero__masthead-links">
            {!staticMode && videoAvailable && (
              <button type="button" className="home-hero__video-toggle" onClick={toggleVideo}
                aria-label={videoPlaying ? 'توقف ویدیوی ساحل' : 'پخش ویدیوی ساحل'} data-playing={videoPlaying || undefined} />
            )}
            <a className="home-hero__about" href="#brand-story">دربارهٔ ات‌مت</a>
          </div>
        </header>
        <div className="home-wrap home-hero__opening-title">
          <p className="home-hero__product-name">{first.name}</p>
          <h1 id="home-title">{first.headline.map(line => <span key={line}>{line}</span>)}</h1>
        </div>

        {flavors.map((flavor, index) => (
          <div key={flavor.slug} className="home-hero__flavor-panel" data-flavor-panel={index}
            style={showcasePalette(flavor.slug)} aria-hidden="true">
            {artChapter >= 0 && (index === artChapter || index === artChapter + 1) &&
              <ShowcaseDoodles slug={flavor.slug} artwork={flavor.artwork} />}
          </div>
        ))}

        <div className="home-hero__reel">
          {flavors.map((flavor, index) => (
            <Link className="home-hero__can" href={flavorHref(flavor.slug, staticMode)} prefetch={false}
              aria-label={'مشاهدهٔ ' + flavor.name} data-reel-slot={index} data-flavor={flavor.slug} key={flavor.slug}>
              <div className="home-hero__print"><CanLid image={flavor.lid} opening={index === 0} /></div>
            </Link>
          ))}
        </div>

        <div className="home-hero__shoreline" aria-hidden="true">
          <BrandEdge id="home-coast-lip" className="home-hero__shore-lip" fillBelow />
          <div className="home-hero__shore-water">
            <BrandEdge id="home-coast-field" className="home-hero__shore-field" fillBelow />
          </div>
        </div>
        <button className="home-hero__opening-cue" type="button" onClick={showProducts}>دیدن طعم‌ها</button>
        <div className="home-hero__still-cue">
          <a className="home-text-link" href="#home-flavor-list">دیدن طعم‌ها</a>
        </div>

        {flavors.map((flavor, index) => (
          <div key={flavor.slug} className="home-wrap home-hero__caption" data-flavor-caption={index}
            aria-hidden="true" style={{ '--flavor-ink': flavor.theme.pale } as CSSProperties}>
            <div>
              <h2>{flavor.label}</h2>
              <p className="home-hero__description">{flavor.name}</p>
            </div>
            <FlavorFacts flavor={flavor} />
          </div>
        ))}

        <span className="home-hero__origin" ref={origin} aria-hidden="true" />
        <span className="home-hero__landing" ref={landing} aria-hidden="true" />
        <BrandEdge id="home-hero-edge" className="home-hero__edge" fillBelow />
      </div>
      <div className="home-hero__runway" aria-hidden="true">
        <div ref={coastLength} className="home-hero__coast-length" />
        <div ref={flavorLength} className="home-hero__flavor-length" />
        <div className="home-hero__flavor-track" />
      </div>
      <StillFlavors flavors={flavors} staticMode={staticMode} />
    </section>
  );
}
