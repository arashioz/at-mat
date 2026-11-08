import { flavors } from '@/features/products/catalog';
import { getFlavorMedia } from '@/features/products/media';
import { BottomNavigation } from './bottom-navigation';
import './site-chrome.css';

export async function SiteNavigation({ logo, flavor, section }: {
  logo: string; flavor?: string; section?: 'recipes' | 'articles';
}) {
  const products = await Promise.all(flavors.map(async product => {
    const media = await getFlavorMedia(product.mediaPrefix);
    return { slug: product.slug, label: product.label, wrap: media.wrapSmall.url, lid: media.lid.url };
  }));
  return <BottomNavigation logo={logo} products={products} flavor={flavor} section={section} />;
}
