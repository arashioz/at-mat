import { getRecipeLogo } from '@/features/recipes/data';
import { KitchenAccount } from '@/features/kitchen/kitchen-account';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'آشپزخانهٔ من', robots: { index: false, follow: false } };
export default async function Page() { return <KitchenAccount logo={await getRecipeLogo()} />; }
