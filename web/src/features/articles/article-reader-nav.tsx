'use client';
import { useEffect, useRef } from 'react';
export function ArticleReaderNav({ sections }: { sections: { id: string; title: string }[] }) {
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const body = document.querySelector<HTMLElement>('[data-article-body]');
      if (!body || !progress.current) return;
      const start = body.getBoundingClientRect().top + window.scrollY;
      const range = Math.max(1, body.offsetHeight - window.innerHeight * .5);
      progress.current.style.scale = `${Math.max(0, Math.min(1, (window.scrollY - start + 100) / range))} 1`;
    };
    update(); window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <aside className="a-toc"><div className="a-reading-track" aria-hidden="true"><div ref={progress} /></div><details open><summary>توی این مقاله <span aria-hidden="true">↓</span></summary><nav aria-label="فهرست مقاله"><ol>{sections.map(s => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}<li><a href="#article-faq">پرسش‌های رایج</a></li><li><a href="#article-sources">منابع</a></li></ol></nav></details></aside>;
}
