'use client';

import { useEffect, useRef } from 'react';
import { INTRO_EVENT } from './can-choreography';
import { createCurrentLight } from './brine-current-light';

const DRIFT_MS = 4800;

export function BrineCurrent({ phase, staticMode = false, lightColor = [0.67, 0.95, 1] }: { phase: 'hero' | 'loader' | 'pending'; staticMode?: boolean; lightColor?: readonly [number, number, number] }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const light = createCurrentLight(node, lightColor);
    if (!light) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let ready = phase !== 'hero' || !!node.closest('.b-page')?.hasAttribute('data-intro');
    let visible = false;
    let frame = 0;
    let lastDraw = 0;
    let startedAt = 0;

    const draw = (now: number) => {
      const { clientWidth, clientHeight } = node;
      if (!visible || !clientWidth || !clientHeight) return;
      const seconds = staticMode || reduce.matches ? 0 : now * 0.001;
      light.draw(clientWidth, clientHeight, seconds);
      lastDraw = now;
    };
    const tick = (now: number) => {
      if (now - lastDraw >= 30) draw(now);
      if (now - startedAt < DRIFT_MS) frame = requestAnimationFrame(tick);
    };
    const play = () => {
      cancelAnimationFrame(frame);
      if (!visible) return;
      startedAt = performance.now();
      draw(startedAt);
      if (ready && !staticMode && !reduce.matches) frame = requestAnimationFrame(tick);
    };
    const onIntro = () => { ready = true; play(); };
    const onContextLost = () => { cancelAnimationFrame(frame); };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      play();
    });
    const resize = new ResizeObserver(() => draw(performance.now()));
    visibility.observe(node);
    resize.observe(node);
    if (phase === 'hero') window.addEventListener(INTRO_EVENT, onIntro, { once: true });
    reduce.addEventListener('change', play);
    node.addEventListener('webglcontextlost', onContextLost);
    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect();
      resize.disconnect();
      window.removeEventListener(INTRO_EVENT, onIntro);
      reduce.removeEventListener('change', play);
      node.removeEventListener('webglcontextlost', onContextLost);
      light.dispose();
    };
  }, [phase, staticMode, lightColor[0], lightColor[1], lightColor[2]]);

  return (
    <div className="brine-current" aria-hidden="true">
      {phase !== 'pending' && <canvas ref={canvas} />}
    </div>
  );
}
