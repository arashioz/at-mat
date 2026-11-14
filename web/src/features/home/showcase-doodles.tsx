import type { CSSProperties } from 'react';
import type { BrineImage } from '@/features/brine/types';

type Crop = readonly [x: number, y: number, width: number, height: number];
type Position = readonly [x: number, y: number];
type Mark = { name: string; crop: Crop; angle?: number; position: Position; mobile: Position };
type Design = { color: string; light: string; shade: string; marks: readonly [Mark, Mark, Mark] };

// Source coordinates are on the original 1040 × 1040 transparent packaging art sheets.
// Every viewport isolates one illustration so it can be positioned and moved independently.
const designs: Record<string, Design> = {
  brine: {
    color: '#08548d', light: '#0aa9f5', shade: '#092554',
    marks: [
      { name: 'salt', crop: [23, 252, 230, 278], angle: -9, position: [23, 31], mobile: [14, 29] },
      { name: 'wave', crop: [8, 782, 365, 250], angle: -8, position: [77, 66], mobile: [84, 75] },
      { name: 'spark', crop: [837, 193, 83, 93], angle: 14, position: [30, 70], mobile: [74, 24] },
    ],
  },
  sunflower: {
    color: '#9c4d09', light: '#ffa921', shade: '#492207',
    marks: [
      { name: 'sunflower', crop: [791, 305, 247, 470], angle: -22, position: [21, 36], mobile: [14, 34] },
      { name: 'wave', crop: [75, 883, 312, 93], angle: -15, position: [80, 66], mobile: [84, 76] },
      { name: 'petal', crop: [329, 836, 145, 76], angle: -21, position: [31, 73], mobile: [74, 26] },
    ],
  },
  'olive-oil': {
    color: '#446b08', light: '#93bf21', shade: '#223908',
    marks: [
      { name: 'olive-branch', crop: [716, 280, 322, 565], angle: -21, position: [21, 34], mobile: [14, 33] },
      { name: 'oil-jug', crop: [8, 504, 341, 408], angle: 13, position: [79, 64], mobile: [83, 74] },
      { name: 'oil-drops', crop: [269, 787, 86, 75], angle: 9, position: [28, 73], mobile: [72, 25] },
    ],
  },
  pepper: {
    color: '#a61438', light: '#f74758', shade: '#4e0a2b',
    marks: [
      { name: 'chili', crop: [549, 506, 491, 481], angle: -10, position: [22, 36], mobile: [15, 32] },
      { name: 'ribbon', crop: [819, 57, 215, 272], angle: 40, position: [77, 65], mobile: [83, 74] },
      { name: 'heart', crop: [57, 81, 101, 108], angle: 12, position: [29, 72], mobile: [75, 25] },
    ],
  },
  smoked: {
    color: '#4d3269', light: '#bd6499', shade: '#241534',
    marks: [
      { name: 'smoke', crop: [8, 31, 249, 392], angle: -15, position: [21, 34], mobile: [15, 32] },
      { name: 'fire', crop: [739, 668, 282, 323], angle: 9, position: [78, 63], mobile: [83, 74] },
      { name: 'spark', crop: [904, 58, 75, 81], angle: 14, position: [30, 73], mobile: [74, 25] },
    ],
  },
  dill: {
    color: '#087654', light: '#17c98b', shade: '#073b32',
    marks: [
      { name: 'dill', crop: [8, 331, 309, 478], angle: -22, position: [22, 34], mobile: [14, 32] },
      { name: 'wave', crop: [607, 872, 393, 110], angle: -10, position: [81, 66], mobile: [84, 76] },
      { name: 'swirl', crop: [167, 276, 75, 73], angle: 10, position: [29, 71], mobile: [74, 25] },
    ],
  },
};

function getDesign(slug: string) { return designs[slug] ?? designs.brine; }

export function showcaseColor(slug: string) { return getDesign(slug).color; }

export function showcasePalette(slug: string): CSSProperties {
  const { color, light, shade } = getDesign(slug);
  return { '--panel-color': color, '--panel-light': light, '--panel-shade': shade } as CSSProperties;
}

export function ShowcaseDoodles({ slug, artwork }: { slug: string; artwork?: BrineImage }) {
  if (!artwork) return null;
  return (
    <div className="home-hero__doodles" aria-hidden="true">
      {getDesign(slug).marks.map(({ name, crop, angle = 0, position, mobile }, index) => (
        <svg key={name} className={`home-ink home-ink--${index + 1}`} data-doodle={name}
          style={{
            '--ink-angle': `${angle}deg`,
            '--ink-x-desktop': `${position[0]}%`,
            '--ink-y-desktop': `${position[1]}%`,
            '--ink-x-mobile': `${mobile[0]}%`,
            '--ink-y-mobile': `${mobile[1]}%`,
          } as CSSProperties}
          width={crop[2]} height={crop[3]} viewBox={crop.join(' ')} focusable="false">
          <image href={artwork.url} width={artwork.width} height={artwork.height} />
        </svg>
      ))}
    </div>
  );
}
