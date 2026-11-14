import type { BrineImage } from '@/features/brine/types';

export function CanLid({ image, opening = false }: {
  image: BrineImage;
  opening?: boolean;
}) {
  return (
    <img className="home-hero__lid"
      src={image.url} width={image.width} height={image.height} alt="" decoding="async"
      loading={opening ? 'eager' : 'lazy'} fetchPriority={opening ? 'high' : undefined} />
  );
}
