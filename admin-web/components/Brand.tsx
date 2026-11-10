'use client';

import { createContext, useContext, type ReactNode } from 'react';

type Assets = { logo: string | null; cover: string | null };
const BrandContext = createContext<Assets>({ logo: null, cover: null });

export function BrandProvider({ assets, children }: { assets: Assets; children: ReactNode }) {
  return <BrandContext.Provider value={assets}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  return useContext(BrandContext);
}

export function BrandLogo({ className = '', decorative = false }: { className?: string; decorative?: boolean }) {
  const { logo } = useBrand();
  return logo
    ? <img className={`admin-logo ${className}`} src={logo} alt={decorative ? '' : 'ات‌مت'} width={700} height={447} />
    : <span aria-hidden={decorative || undefined} className={`admin-logo-text ${className}`}>ات‌مت</span>;
}
