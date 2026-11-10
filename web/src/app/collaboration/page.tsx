import type { Metadata } from 'next';
import { BrandEdge } from '@/features/brine/brand-edge';
import { brineCopy } from '@/features/brine/content';
import { CollaborationForm } from '@/features/company/collaboration-form';
import { CompanyShell } from '@/features/company/company-shell';
import { getFlavorMedia } from '@/features/products/media';

export const metadata: Metadata = {
  title: 'همکاری با ات‌مت',
  description: 'درخواست نمایندگی فروش یا استخدام در ات‌مت را ثبت کنید.',
  alternates: { canonical: '/collaboration' },
};

export default async function CollaborationPage({ searchParams }: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const [query, brine, sunflower] = await Promise.all([searchParams, getFlavorMedia('brine'), getFlavorMedia('sunflower')]);
  const initialKind = query.type === 'employment' ? 'employment' : 'sales';
  return (
    <CompanyShell logo={brine.logo.url} section="collaboration">
      <section className="company-hero company-hero--collaboration" aria-labelledby="collaboration-title">
        <div className="company-wrap company-hero__layout">
          <div className="company-hero__copy">
            <p className="company-kicker">همکاری با ات‌مت</p>
            <h1 id="collaboration-title">با هم کار کنیم.</h1>
            <p>اگر می‌خواهی محصولات ات‌مت را در شهر خودت عرضه کنی یا به تیم ما بپیوندی، از همین‌جا شروع کن.</p>
            <a className="company-button" href="#application">انتخاب مسیر همکاری <span aria-hidden="true">↓</span></a>
          </div>
          <div className="company-packshots" aria-hidden="true">
            <img src={brine.lid.url} width={brine.lid.width} height={brine.lid.height} alt="" />
            <img src={sunflower.lid.url} width={sunflower.lid.width} height={sunflower.lid.height} alt="" />
          </div>
        </div>
        <BrandEdge id="collaboration-hero-edge" className="company-hero__edge" fillBelow />
      </section>

      <section className="company-wrap company-section company-section--application" aria-labelledby="application-title">
        <header className="company-section__head">
          <p className="company-kicker">ثبت درخواست</p>
          <h2 id="application-title">مسیر همکاری‌ات را انتخاب کن.</h2>
        </header>
        <CollaborationForm initialKind={initialKind} />
      </section>

      <aside className="company-wrap company-contact" aria-labelledby="collaboration-contact">
        <div>
          <h2 id="collaboration-contact">سؤالی دربارهٔ همکاری داری؟</h2>
          <p>از راه‌های ارتباطی ات‌مت با ما در تماس باش.</p>
        </div>
        <div className="company-actions">
          <a className="company-button company-button--outline" href={brineCopy.contact.phone.href}><bdi>{brineCopy.contact.phone.label}</bdi></a>
          <a className="company-text-link" href={brineCopy.contact.email.href}><bdi>{brineCopy.contact.email.label}</bdi></a>
        </div>
      </aside>
    </CompanyShell>
  );
}
