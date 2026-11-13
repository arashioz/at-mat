import type { CSSProperties } from 'react';
import type { BrineImage } from '@/features/brine/types';

type Crop = readonly [x: number, y: number, width: number, height: number];
type Mark = { name: string; crop: Crop; angle?: number };
type Design = { color: string; marks: readonly [Mark, Mark, Mark] };

// Source coordinates are on the original 1040 × 1040 transparent packaging art sheets.
// Every viewport isolates one illustration so it can be positioned and moved independently.
const designs: Record<string, Design> = {
  brine: {
    color: '#0d3957',
    marks: [
      { name: 'salt', crop: [23, 252, 230, 278], angle: -9 },
      { name: 'wave', crop: [8, 782, 365, 250], angle: -8 },
      { name: 'spark', crop: [837, 193, 83, 93], angle: 14 },
    ],
  },
  sunflower: {
    color: '#785315',
    marks: [
      { name: 'sunflower', crop: [791, 305, 247, 470], angle: -22 },
      { name: 'wave', crop: [75, 883, 312, 93], angle: -15 },
      { name: 'petal', crop: [329, 836, 145, 76], angle: -21 },
    ],
  },
  'olive-oil': {
    color: '#414b1c',
    marks: [
      { name: 'olive-branch', crop: [716, 280, 322, 565], angle: -21 },
      { name: 'oil-jug', crop: [8, 504, 341, 408], angle: 13 },
      { name: 'oil-drops', crop: [269, 787, 86, 75], angle: 9 },
    ],
  },
  pepper: {
    color: '#73252e',
    marks: [
      { name: 'chili', crop: [549, 506, 491, 481], angle: -10 },
      { name: 'ribbon', crop: [819, 57, 215, 272], angle: 40 },
      { name: 'heart', crop: [57, 81, 101, 108], angle: 12 },
    ],
  },
  smoked: {
    color: '#333234',
    marks: [
      { name: 'smoke', crop: [8, 31, 249, 392], angle: -15 },
      { name: 'fire', crop: [739, 668, 282, 323], angle: 9 },
      { name: 'spark', crop: [904, 58, 75, 81], angle: 14 },
    ],
  },
  dill: {
    color: '#11503d',
    marks: [
      { name: 'dill', crop: [8, 331, 309, 478], angle: -22 },
      { name: 'wave', crop: [607, 872, 393, 110], angle: -10 },
      { name: 'swirl', crop: [167, 276, 75, 73], angle: 10 },
    ],
  },
};

function getDesign(slug: string) { return designs[slug] ?? designs.brine; }

export function showcaseColor(slug: string) { return getDesign(slug).color; }

export function ShowcaseDoodles({ slug, artwork }: { slug: string; artwork?: BrineImage }) {
  if (!artwork) return null;
  return (
    <div className="home-hero__doodles" aria-hidden="true">
      {getDesign(slug).marks.map(({ name, crop, angle = 0 }, index) => (
        <svg key={name} className={`home-ink home-ink--${index + 1}`} data-doodle={name}
          style={{ '--ink-angle': `${angle}deg` } as CSSProperties}
          width={crop[2]} height={crop[3]} viewBox={crop.join(' ')} focusable="false">
          <image href={artwork.url} width={artwork.width} height={artwork.height} />
        </svg>
      ))}
    </div>
  );
}
