import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { getFlavor } from '@/features/products/catalog';
import { ProductLanding } from '@/features/products/product-landing';
import { getFlavorMedia } from '@/features/products/media';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ flavor: string }>; searchParams: Promise<{ motion?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getFlavor((await params).flavor);
  if (!product) notFound();
  const media = await getFlavorMedia(product.mediaPrefix);
  return {
    title: product.metadataTitle,
    description: product.copy.description,
    alternates: { canonical: `/flavors/${product.slug}` },
    icons: { icon: media.logo.url, apple: media.logo.url },
  };
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const product = getFlavor((await params).flavor);
  return { themeColor: product?.theme.heroTop ?? '#041e2d' };
}

export default async function FlavorPage({ params, searchParams }: Props) {
  const [route, query] = await Promise.all([params, searchParams]);
  const product = getFlavor(route.flavor);
  if (!product) notFound();
  return <ProductLanding product={product} staticMode={query.motion === 'off'} />;
}
