import { notFound } from 'next/navigation';
import { getRecipeLogo } from '@/features/recipes/data';
import { KitchenChat } from '@/features/kitchen/kitchen-chat';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'گفتگو با همراه آشپزی', robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) notFound();
  return <KitchenChat key={id} logo={await getRecipeLogo()} id={id} />;
}
