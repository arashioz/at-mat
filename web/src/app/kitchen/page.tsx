import { getRecipeLogo } from '@/features/recipes/data';
import { KitchenChat } from '@/features/kitchen/kitchen-chat';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'همراه آشپزی ات‌مت', description: 'با مواد موجود و سلیقهٔ خودت، رسپی بعدی را پیدا کن.' };
export default async function Page() { return <KitchenChat logo={await getRecipeLogo()} />; }
