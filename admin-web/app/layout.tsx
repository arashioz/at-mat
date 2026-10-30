import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'At-Mat Admin',
  description: 'پنل مدیریت At-Mat',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans text-slate-800 antialiased">{children}</body>
    </html>
  );
}
