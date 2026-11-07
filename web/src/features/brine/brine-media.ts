import { getFlavorMedia } from '../products/media';
export type { FlavorMedia as BrineMedia } from '../products/media';
/** Compatibility entrypoint; all flavors use the shared manifest loader. */
export const getBrineMedia = () => getFlavorMedia('brine');
