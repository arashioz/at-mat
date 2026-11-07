import type { ReactNode } from 'react';
import type { Viewport } from 'next';

export const viewport: Viewport = { themeColor: '#082438' };

export default function RecipesLayout({ children }: { children: ReactNode }) {
  return children;
}
