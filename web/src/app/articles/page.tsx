import type { Metadata } from 'next';
import Link from 'next/link';
import { RecipeShell } from '@/features/recipes/recipe-shell';
import { getArticles, getArticleLogo, siteOrigin } from '@/features/articles/data';
import { ArticleBrowser } from '@/features/articles/article-browser';
import { BrandEdge } from '@/features/brine/brand-edge';
import '@/features/articles/articles.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'مجله ات‌مت؛ مقاله‌های تغذیه، سلامتی و ورزش', description: 'از خواندن برچسب کنسرو تن ماهی تا تغذیه روزمره، ورزش و دنیای آبزیان؛ مقاله‌های مجله ات‌مت با منابع و ایده‌های کاربردی.', alternates: { canonical: `${siteOrigin}/articles` } };
export default async function ArticlesPage() {
  const [articles, logo] = await Promise.all([getArticles(), getArticleLogo()]);
  const featured = articles.find(a => a.slug === 'label-reading') ?? articles[0];
  return <RecipeShell logo={logo} section="articles"><main id="main-content" className="a-site" tabIndex={-1}>
    <section className="a-index-hero"><div><p className="a-eyebrow">مجلهٔ ات‌مت</p><h1>از روی قوطی،<br /><span>تا انتخاب تو.</span></h1><p className="a-index-intro">تغذیه، سلامتی و زندگیِ فعال.<br />یه کم آگاهی، کنار یه دنیا مزه.</p><a className="a-link" href="#article-library">بریم سراغ مقاله‌ها</a></div>
    {featured && <Link className="a-featured" href={`/articles/${featured.slug}`}>{featured.cover && <img src={featured.cover.url} alt={featured.cover.alt} width={1536} height={1024} fetchPriority="high" />}<div><p>{featured.category} · {featured.readingMinutes.toLocaleString('fa-IR')} دقیقه مطالعه</p><h2>{featured.title}</h2><span>مقالهٔ پیشنهادی</span></div></Link>}
    <BrandEdge id="articles-index-edge" className="a-hero-edge" fillBelow /></section>
    <ArticleBrowser articles={articles} />
    <section className="a-kitchen-link"><div><p className="a-eyebrow">از خوندن، به پختن</p><h2>حالا باهاش<br />چی بپزیم؟</h2><p>رسپی‌ها جای خودشون رو دارن؛ مواد لازم، مراحل تهیه و ایده‌های سرو با تن ماهی.</p></div><Link href="/recipes" className="a-link">بریم آشپزخونهٔ ات‌مت</Link></section>
  </main></RecipeShell>;
}
