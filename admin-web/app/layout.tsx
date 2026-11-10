import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { BrandProvider } from '../components/Brand';
import { getAdminBrand } from '../lib/brand';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { logo } = await getAdminBrand();
  return {
    title: { default: 'میز کار ات‌مت', template: '%s | میز کار ات‌مت' },
    description: 'پنل مدیریت محتوا و عملیات ات‌مت',
    robots: { index: false, follow: false },
    icons: logo ? { icon: logo } : undefined,
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#082438',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const assets = await getAdminBrand();
  return (
    <html lang="fa" dir="rtl">
      <body><BrandProvider assets={assets}>{children}</BrandProvider></body>
    </html>
  );
}
