'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandEdge } from '../../../web/src/features/brine/brand-edge';
import { AdminIcon } from '../../components/AdminIcon';
import { AppShell, useAdminWorkspace } from '../../components/AppShell';
import { useBrand } from '../../components/Brand';
import { faCount } from '../../components/AdminForms';
import { apiFetch } from '../../lib/api';
import { listMedia, SITE_URL } from '../../lib/media';
import { canOpen, NAV_ITEMS } from '../../lib/navigation';

const countSources = {
  '/articles': { route: '/articles?summary=1', label: 'مقاله' },
  '/recipes': { route: '/recipes', label: 'رسپی' },
  '/library': { route: '/storage/images', label: 'تصویر' },
  '/customers': { route: '/customers', label: 'مشتری' },
  '/products': { route: '/products', label: 'محصول' },
} as const;

function Overview() {
  const { token, user, features } = useAdminWorkspace();
  const { cover } = useBrand();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const sections = NAV_ITEMS.filter(item => (item.group === 'content' || item.group === 'operations') && canOpen(item, user.role, features));
  useEffect(() => {
    let current = true;
    const permitted = NAV_ITEMS.filter(item => item.href in countSources && canOpen(item, user.role, features));
    Promise.allSettled(permitted.map(async ({ href }) => {
      const { route } = countSources[href as keyof typeof countSources];
      const items = href === '/library' ? await listMedia(token) : await apiFetch<unknown[]>(route, token);
      return [href, items.length] as const;
    })).then(results => {
      if (current) setCounts(Object.fromEntries(results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])));
    });
    return () => { current = false; };
  }, [token, user.role, features]);

  return (
    <div className="admin-section-stack">
      <section className="admin-overview-hero">
        {cover && <img src={cover} className="admin-overview-photo" alt="" fetchPriority="high" />}
        <div className="admin-overview-copy">
          <h2>سلام، <bdi>{user.fullName}</bdi></h2>
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="admin-overview-link">مشاهدهٔ سایت <AdminIcon name="external" size={16} /></a>
        </div>
        <BrandEdge id="atmat-overview-edge" className="admin-overview-edge" fillBelow />
      </section>
      {sections.length > 0 ? <section aria-labelledby="workspace-sections"><div className="admin-panel-head"><div><h2 id="workspace-sections" className="admin-section-title">بخش‌های میز کار</h2></div></div>
        <div className="admin-overview-grid">{sections.map(item => {
          const count = counts[item.href];
          const label = countSources[item.href as keyof typeof countSources]?.label;
          return <Link className="admin-panel admin-module" href={item.href} key={item.href}>
            <div className="admin-module-top"><span className="admin-module-icon"><AdminIcon name={item.icon} size={22} /></span>{label && count !== undefined && <span className="admin-chip">{faCount(count)} {label}</span>}</div>
            <h3>{item.label}</h3><p>{item.description}</p>
            <span className="admin-module-arrow"><AdminIcon name="arrow" size={18} /></span>
          </Link>;
        })}</div>
      </section> : <section className="admin-panel admin-empty"><h2>حساب کاربری</h2><p>مشخصات حساب خود را ببین.</p><Link className="admin-button admin-button--secondary" href="/account">رفتن به حساب</Link></section>}
    </div>
  );
}

export default function DashboardPage() {
  return <AppShell title="پیشخوان"><Overview /></AppShell>;
}
