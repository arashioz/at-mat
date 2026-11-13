import type { Metadata } from 'next';
import { siteOrigin } from '@/features/articles/data';
import { HomeLanding } from '@/features/home/home-landing';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'ات‌مت | تن ماهی به سلیقهٔ تو' },
  description: 'با خانوادهٔ تن ماهی ات‌مت، از آب‌نمک تا دودی، آشنا شو و برای غذای امروزت از رسپی‌ها و مجلهٔ ات‌مت ایده بگیر.',
  alternates: { canonical: new URL('/', siteOrigin) },
};

export default async function IndexPage({ searchParams }: { searchParams: Promise<{ motion?: string }> }) {
  return <HomeLanding staticMode={(await searchParams).motion === 'off'} />;
}
