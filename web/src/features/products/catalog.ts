import { brineCopy } from '../brine/content';
import { sunflowerFlavor, oliveOilFlavor, pepperFlavor, smokedFlavor, dillFlavor } from './flavor-data';
import type { FlavorDefinition } from './types';

/**
 * One route and ProductLanding serve all six flavors. New products must use
 * verified label copy, packaging uploaded through the storage API,
 * and their own palette and manifest mediaPrefix.
 * Structure and motion changes belong in the shared components, never per-route copies.
 */
export const flavors: readonly FlavorDefinition[] = [
  {
    slug: 'brine', label: 'آب‌نمک', metadataTitle: 'تن ماهی در آب‌نمک', mediaPrefix: 'brine', copy: brineCopy,
    theme: {
      accent: '#2d85cd', deep: '#1a4b6c', navy: '#082438', pale: '#e9f2f8', notes: '#5b8dc0',
      heroTop: '#318cd5', heroBottom: '#2475b8', heroGlow: 'rgb(5 168 233 / 0.5)', light: [0.67, 0.95, 1],
    },
  },
  sunflowerFlavor,
  oliveOilFlavor,
  pepperFlavor,
  smokedFlavor,
  dillFlavor,
];

export function getFlavor(slug: string): FlavorDefinition | undefined {
  return flavors.find(flavor => flavor.slug === slug);
}
