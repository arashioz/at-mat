import type { ReactNode } from 'react';
import { SiteFooter } from '@/features/site/site-footer';
import type { SiteSection } from '@/features/site/site-links';
import { SiteNavigation } from '@/features/site/site-navigation';
import './company.css';

export function CompanyShell({ logo, section, children }: { logo: string; section: SiteSection; children: ReactNode }) {
  return (
    <div className="company-page">
      <SiteNavigation logo={logo} section={section} />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter logo={logo} />
    </div>
  );
}
