import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { BrandEdge } from '@/features/brine/brand-edge';
import { brineCopy } from '@/features/brine/content';
import { CompanyShell } from '@/features/company/company-shell';
import { flavors } from '@/features/products/catalog';
import { getFlavorMedia } from '@/features/products/media';
import { NavIcon } from '@/features/site/nav-icons';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'دربارهٔ ما',
  description: 'با ات‌مت و طعم‌های کنسرو ماهی تن، ایده‌های سرو و راه‌های ارتباط با ما آشنا شوید.',
  alternates: { canonical: '/about' },
};

export default async function AboutPage() {
  const products = await Promise.all(flavors.map(async flavor => ({ ...flavor, media: await getFlavorMedia(flavor.mediaPrefix) })));
  const { logo, ideas } = products[0].media;
  const hero = ideas['brine-idea-pasta'];
  return (
    <CompanyShell logo={logo.url} section="about">
      <section className="company-hero company-hero--about" aria-labelledby="about-title">
        <div className="company-wrap company-hero__layout">
          <div className="company-hero__copy">
            <p className="company-kicker">دربارهٔ ات‌مت</p>
            <h1 id="about-title">از یک قوطی<br />تا سفرهٔ تو.</h1>
            <p>ات‌مت خانواده‌ای از کنسرو ماهی تن است. طعم را متناسب با غذای امروزت انتخاب کن و برای سرو، از آشپزخانهٔ ات‌مت ایده بگیر.</p>
            <div className="company-actions">
              <a className="company-button company-button--light" href="#flavors">آشنایی با طعم‌ها <span aria-hidden="true">↓</span></a>
              <a className="company-text-link" href="/collaboration">همکاری با ات‌مت <span aria-hidden="true">←</span></a>
            </div>
          </div>
          <figure className="company-hero__photo">
            <img src={hero.url} alt="تصویرسازی از پاستا با تن ماهی" width={hero.width} height={hero.height} fetchPriority="high" />
            <figcaption>پیشنهاد سرو از آشپزخانهٔ ات‌مت</figcaption>
          </figure>
        </div>
        <BrandEdge id="about-hero-edge" className="company-hero__edge" fillBelow />
      </section>

      <section className="company-wrap company-section company-story" aria-labelledby="story-title">
        <header className="company-section__head">
          <p className="company-kicker">ات‌مت در یک نگاه</p>
          <h2 id="story-title">برای وقتی که می‌پرسی امروز چی بپزم؟</h2>
        </header>
        <div className="company-story__text">
          <p>یک بار پای سالاد خیار و لیمو در میان است و بار دیگر، پاستای گرم یا پلوی خانه. تن ماهی آب‌نمک دستت را برای چاشنی باز می‌گذارد. اگر طعم مشخص‌تری می‌خواهی، می‌توانی سراغ روغن زیتون، فلفل، دود یا شوید بروی.</p>
          <p>در صفحهٔ هر طعم، ترکیبات، جدول ارزش غذایی و دستور مصرف روی بسته را کنار پیشنهادهای سرو آورده‌ایم. می‌توانی از روی برچسب مقایسه کنی و برای همان محصول، دستور پخت مناسب پیدا کنی.</p>
        </div>
      </section>

      <section className="company-wrap company-section" id="flavors" aria-labelledby="flavors-title">
        <header className="company-section__head">
          <p className="company-kicker">خانوادهٔ طعم‌ها</p>
          <h2 id="flavors-title">طعم غذای امروزت را پیدا کن.</h2>
        </header>
        <ul className="company-flavors">
          {products.map(({ slug, label, copy, media, theme }) => (
            <li key={slug}>
              <a href={`/flavors/${slug}`} style={{ '--flavor-pale': theme.pale } as CSSProperties}>
                <img src={media.lid.url} width={media.lid.width} height={media.lid.height} alt="" loading="lazy" />
                <h3>{label}</h3>
                <p>{copy.headline.join(' ')}</p>
                <span aria-hidden="true">←</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="company-wrap company-section" aria-labelledby="explore-title">
        <header className="company-section__head">
          <h2 id="explore-title">از آشپزخانه تا مجلهٔ ات‌مت</h2>
          <p>برای پخت یک وعده یا خواندن دربارهٔ انتخاب و نگهداری تن ماهی، از اینجا شروع کن.</p>
        </header>
        <div className="company-explore">
          <a href="/recipes">
            <NavIcon name="recipes" />
            <h3>آشپزخانهٔ ات‌مت</h3>
            <p>سالاد، ساندویچ یا غذای گرم را بر اساس طعم انتخاب کن.</p>
            <span className="company-text-link">دیدن رسپی‌ها <span aria-hidden="true">←</span></span>
          </a>
          <a href="/articles">
            <NavIcon name="articles" />
            <h3>مجلهٔ ات‌مت</h3>
            <p>دربارهٔ برچسب، تغذیه و نگهداری کنسرو ماهی بخوان.</p>
            <span className="company-text-link">دیدن مقاله‌ها <span aria-hidden="true">←</span></span>
          </a>
        </div>
      </section>

      <section className="company-wrap company-contact" aria-labelledby="about-contact">
        <div>
          <p className="company-kicker">راه‌های ارتباطی</p>
          <h2 id="about-contact">با ات‌مت در تماس باش.</h2>
          <p>برای پرسش دربارهٔ محصولات تماس بگیر یا درخواست همکاری‌ات را ثبت کن.</p>
        </div>
        <div className="company-actions">
          <a className="company-button" href="/collaboration">همکاری با ات‌مت <span aria-hidden="true">←</span></a>
          <a className="company-text-link" href={brineCopy.contact.phone.href}><bdi>{brineCopy.contact.phone.label}</bdi></a>
        </div>
      </section>
    </CompanyShell>
  );
}
