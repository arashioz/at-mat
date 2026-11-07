import { gsap } from 'gsap';

/** Move the repeating pattern, so stronger motion never exposes a gap at either edge. */
export function animateBrandEdges(page: HTMLElement) {
  page.querySelectorAll<SVGSVGElement>('.b-brand-edge').forEach(edge => {
    const pattern = edge.querySelector('pattern');
    if (!pattern) return;
    gsap.fromTo(pattern, { attr: { patternTransform: 'translate(220 0)' } }, {
      attr: { patternTransform: 'translate(-220 0)' }, ease: 'none',
      scrollTrigger: { trigger: edge, start: 'top bottom', end: 'bottom top', scrub: 0.45 },
    });
  });
}

/** Shared choreography for product serving ideas and related recipe cards. */
export function animateCardStack(list: HTMLElement, stacked: boolean, selectors: { card: string; scroll: string; caption: string }) {
  list.toggleAttribute('data-stacked', stacked);
  const cards = Array.from(list.querySelectorAll<HTMLElement>(selectors.card));
  const direction = getComputedStyle(list).direction === 'rtl' ? 1 : -1;
  const edge = (index: number, viewport: string, bottom = false) => () => {
    if (!stacked) return `${bottom ? 'bottom' : 'top'} ${viewport}`;
    // Sticky elements move visually; measure their normal rows from the list.
    const gap = parseFloat(getComputedStyle(list).rowGap) || 0;
    const offset = cards.slice(0, index).reduce((y, card) => y + card.offsetHeight + gap, 0);
    return `top+=${offset + (bottom ? cards[index].offsetHeight : 0)} ${viewport}`;
  };
  cards.forEach((card, index) => {
    const scroll = card.querySelector<HTMLElement>(selectors.scroll);
    const image = card.querySelector('img');
    const caption = card.querySelector(selectors.caption);
    if (!scroll || !image || !caption) return;
    const trigger = stacked ? list : card;
    const start = edge(index, 'bottom');
    const spread = index === 1 ? 0 : index === 0 ? direction : -direction;
    gsap.timeline({
      defaults: { ease: 'power2.out' },
      scrollTrigger: { trigger, start, end: edge(index, stacked ? '42%' : '47%'), scrub: 0.4 },
    })
      .fromTo(scroll, { x: spread * (stacked ? 14 : 38), y: stacked ? 52 : 84 + index * 24, rotation: (index === 1 ? -1 : 1) * (stacked ? 4 : 8), opacity: stacked ? 1 : 0.45 }, { x: 0, y: 0, rotation: 0, opacity: 1 }, 0)
      .fromTo(caption, { y: 12 }, { y: 0 }, 0);
    gsap.fromTo(image, { '--card-image-shift': '-8%' }, {
      '--card-image-shift': '8%', ease: 'none',
      scrollTrigger: { trigger, start, end: edge(index, stacked ? '15%' : 'top', !stacked), scrub: true },
    });
    if (stacked && index < cards.length - 1) gsap.fromTo(card, { scale: 1 }, {
      scale: 0.94, ease: 'none',
      scrollTrigger: { trigger: list, start: edge(index + 1, '80%'), end: edge(index + 1, '28%'), scrub: true },
    });
  });
  return () => list.removeAttribute('data-stacked');
}
