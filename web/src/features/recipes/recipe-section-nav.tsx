'use client';

import { useEffect, useState } from 'react';

const sections = [
  ['ingredients', 'مواد لازم'], ['method', 'طرز تهیه'],
  ['recipe-nutrition', 'ارزش غذایی'], ['recipe-questions', 'پرسش‌ها'],
] as const;

export function RecipeSectionNav() {
  const [active, setActive] = useState<string>('ingredients');
  useEffect(() => {
    const visible = new Map<string, Element>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.set(entry.target.id, entry.target);
        else visible.delete(entry.target.id);
      });
      const first = [...visible.values()].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
      // Ingredients and method share a desktop row; keep the chosen visible section active.
      if (first) setActive(previous => visible.has(previous) ? previous : first.id);
    }, { rootMargin: '-15% 0px -60% 0px' });
    sections.forEach(([id]) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);
  return <nav className="r-recipe-nav" aria-label="بخش‌های دستور پخت">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={() => setActive(id)}>{label}</a>)}</nav>;
}
