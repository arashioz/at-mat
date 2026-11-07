import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const peyda = localFont({
  src: [
    { path: '../fonts/peyda/PeydaWebFaNum-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/peyda/PeydaWebFaNum-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/peyda/PeydaWebFaNum-Bold.woff2', weight: '700', style: 'normal' },
    { path: '../fonts/peyda/PeydaWebFaNum-ExtraBold.woff2', weight: '800', style: 'normal' },
    { path: '../fonts/peyda/PeydaWebFaNum-Black.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-peyda',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: { default: 'ات‌مت', template: '%s | ات‌مت' },
  description: 'کنسرو ماهی تن ات‌مت؛ طعم‌های مختلف، به سلیقهٔ تو.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#2D85CD',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={peyda.variable}>
      <body>
        <a className="skip-link" href="#main-content">رفتن به محتوای اصلی</a>
        {children}
      </body>
    </html>
  );
}
