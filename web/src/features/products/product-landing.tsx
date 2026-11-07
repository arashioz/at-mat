import type { CSSProperties } from 'react';
import { BrineCurrent } from '@/features/brine/brine-current';
import { brineSocial } from '@/features/brine/content';
import { WeightBadge } from '@/features/brine/weight-badge';
import { IngredientTabs } from '@/features/brine/ingredient-tabs';
import { BrandEdge } from '@/features/brine/brand-edge';
import { BrineNutrition } from '@/features/brine/brine-nutrition';
import { BrineMotion } from '@/features/brine/brine-motion';
import { CanStage } from '@/features/brine/can-stage';
import { getFlavorMedia } from './media';
import type { FlavorDefinition } from './types';
import { flavors } from './catalog';
import { ArrowUpIcon, InstagramIcon, LinkedinIcon, MailIcon, PhoneIcon, XIcon } from '@/features/brine/icons';
import './product-landing.css';

const SOCIAL_ICONS = { instagram: InstagramIcon, linkedin: LinkedinIcon, x: XIcon } as const;
const SITE_SECTIONS = ['صفحهٔ اصلی', 'محصولات', 'رسپی‌ها', 'بلاگ', 'دربارهٔ ما', 'همکاری با ات‌مت'];

export async function ProductLanding({ product, staticMode }: { product: FlavorDefinition; staticMode: boolean }) {
  const copy = product.copy;
  const media = await getFlavorMedia(product.mediaPrefix, copy.recipes.items);
  const { recipes, contact } = copy;
  const theme = product.theme;
  const style = {
    '--brine-blue': theme.accent, '--brine-deep': theme.deep, '--brine-navy': theme.navy,
    '--brine-ice': theme.pale, '--product-notes': theme.notes,
    '--hero-ink': theme.heroText ?? '#f4fbfe',
    '--hero-top': theme.heroTop, '--hero-bottom': theme.heroBottom, '--hero-glow': theme.heroGlow,
  } as CSSProperties;
  const posterStyle = { '--wrap': `url("${media.wrapSmall.url}")`, '--lid': `url("${media.lid.url}")` } as CSSProperties;

  return (
    <BrineMotion key={product.slug} staticMode={staticMode} style={style} flavor={product.slug}>
      <noscript><style>{'.b-loader{display:none!important}html.is-loading{overflow:auto!important}'}</style></noscript>
      <CanStage wrap={media.wrap} wrapSmall={media.wrapSmall} lid={media.lid} staticMode={staticMode} netWeight={copy.netWeight} lightColor={theme.light} />

      <header className="b-nav" data-nav>
        <a className="b-nav__logo" href="#main-content" aria-label="ات‌مت، بالای صفحه">
          <img src={media.logo.url} alt="" width={media.logo.width} height={media.logo.height} />
        </a>
        <nav className="b-nav__links" aria-label="بخش‌های صفحه">
          <a href="#details" data-nav-link="details" data-magnetic>مشخصات</a>
          <a href="#recipes" data-nav-link="recipes" data-magnetic>ایده سرو</a>
          <a href="/recipes" data-magnetic>رسپی‌ها</a>
          <a href="/articles" data-magnetic>مقالات</a>
        </nav>
        <details className="b-flavors">
          <summary>طعم‌ها <span className="b-flavors__current">{product.label}</span><span className="b-flavors__chevron" aria-hidden="true">⌄</span></summary>
          <nav className="b-flavors__menu" aria-label="طعم‌های ات‌مت">
            <p>یه دنیا مزه.<span>طعم تو کدومه؟</span></p>
            {flavors.map(flavor => (
              <a key={flavor.slug} href={`/flavors/${flavor.slug}`} aria-current={flavor.slug === product.slug ? 'page' : undefined} style={{ '--flavor-swatch': flavor.theme.heroTop } as CSSProperties}>
                <span className="b-flavors__dot" aria-hidden="true" />
                <span>{flavor.label}</span>
                <span className="b-flavors__arrow" aria-hidden="true">{flavor.slug === product.slug ? '✓' : '↖'}</span>
              </a>
            ))}
          </nav>
        </details>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="b-hero" aria-labelledby="brine-title">
          <BrineCurrent phase="hero" staticMode={staticMode} lightColor={theme.light} />
          <h1 id="brine-title" className="b-hero__title">
            {copy.headline.map((line) => (
              <span className="b-mask" key={line}><span data-line>{line}</span></span>
            ))}
          </h1>
          <div className="b-hero__can" data-can-slot="hero">
            <figure className="b-poster" style={posterStyle}>
              <span className="b-poster__body" />
              <span className="b-poster__lid" />
              <figcaption className="sr-only">{copy.name} ات‌مت با طرح واقعی بسته‌بندی</figcaption>
            </figure>
          </div>
        </section>

        <section className="b-detail" id="details" aria-labelledby="details-title">
          <BrandEdge id="details-logo-start" className="b-detail__edge" fillBelow />
          <div className="b-detail__stage">
            <header className="b-detail__head">
              <p className="b-kicker"><b>۰۱</b>محتویات محصول</p>
              <h2 id="details-title" className="b-detail__title">{copy.name}</h2>
              <p className="b-detail__description">{copy.description}</p>
              <p className="sr-only">{copy.netWeight} گرم، وزن خالص</p>
            </header>
            <div className="b-detail__can" data-can-slot="stage" aria-hidden="true">
              <div className="b-poster" style={posterStyle}>
                <span className="b-poster__body" />
                <span className="b-poster__lid" />
              </div>
              <WeightBadge weight={copy.netWeight} className="b-detail__badge" />
            </div>
            <div className="b-detail__ingredients"><IngredientTabs steps={copy.steps} /></div>
          </div>
        </section>

        <BrineNutrition nutrition={copy.nutrition} />

        <section className="b-notes" aria-label="نکته‌های مصرف">
          <ul className="b-notes__row">
            {copy.notes.map((note) => (
              <li key={note.figure} className="b-note">
                <p className="b-note__figure"><b>{note.figure}</b><span>{note.unit}</span></p>
                <p className="b-note__text">{note.text}</p>
              </li>
            ))}
          </ul>
          <p className="b-notes__small">{copy.storage} {copy.warning}</p>
        </section>

        <section className="b-recipes" id="recipes" aria-labelledby="recipes-title">
          <BrandEdge id="recipes-logo-start" className="b-recipes__edge" />
          <header className="b-recipes__head">
            <p className="b-kicker" data-reveal><b>۰۳</b>ایده سرو</p>
            <h2 id="recipes-title">
              {recipes.title.map((line) => (
                <span className="b-mask" key={line}><span data-line>{line}</span></span>
              ))}
            </h2>
            <p className="b-recipes__note" data-reveal>{recipes.note}</p>
          </header>
          <ol className="b-cards">
            {recipes.items.map((recipe) => {
              const image = media.ideas[recipe.image];
              return (
                <li key={recipe.id} className="b-card" data-card>
                  <div className="b-card__scroll">
                    <div className="b-card__body">
                      <a className="b-card__link" href={recipe.href} aria-label={`دستور تهیهٔ ${recipe.title}`}>
                      <figure className="b-card__media" data-tilt>
                        <img src={image.url} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" />
                        <span className="b-card__num" aria-hidden="true">{recipe.numeral}</span>
                        <figcaption>
                          <span className="b-card__title">{recipe.title}</span>
                          <p className="b-card__line">{recipe.line}</p>
                        </figcaption>
                      </figure>
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <footer className="b-footer" id="site-footer">
        <BrandEdge id="footer-logo-start" className="b-footer__edge" />
        <div className="b-footer__top">
          <a className="b-footer__logo" href="#main-content" aria-label="ات‌مت، بالای صفحه">
            <img src={media.logo.url} alt="" width={media.logo.width} height={media.logo.height} loading="lazy" />
          </a>
          <p className="b-footer__line">
            {copy.headline.map((line) => <span key={line}>{line}</span>)}
          </p>
          <a className="b-footer__up" href="#main-content" data-magnetic aria-label="بالای صفحه">
            <ArrowUpIcon />
          </a>
        </div>

        <div className="b-footer__grid">
          <div className="b-footer__col">
            <h2>دسترسی راحت</h2>
            <ul className="b-footer__pages">
              {SITE_SECTIONS.map((title) => <li key={title}>{title === 'رسپی‌ها' ? <a href="/recipes">{title}</a> : title === 'بلاگ' ? <a href="/articles">مقالات</a> : title}</li>)}
            </ul>
          </div>
          <div className="b-footer__col">
            <h2>طعم‌های ات‌مت</h2>
            <ul className="b-footer__pages">
              {flavors.map(flavor => <li key={flavor.slug}><a href={`/flavors/${flavor.slug}`} aria-current={flavor.slug === product.slug ? 'page' : undefined}>{flavor.label}</a></li>)}
            </ul>
          </div>
          <div className="b-footer__col">
            <h2>ارتباط با ما</h2>
            <ul className="b-footer__icons">
              <li>
                <a href={contact.phone.href} aria-label={`تماس تلفنی، ${contact.phone.label}`} title={contact.phone.label}><PhoneIcon /></a>
              </li>
              <li>
                <a href={contact.email.href} aria-label={`ایمیل، ${contact.email.label}`} title={contact.email.label}><MailIcon /></a>
              </li>
              {brineSocial.map((item) => {
                const Icon = SOCIAL_ICONS[item.id];
                return (
                  <li key={item.id}>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label} data-magnetic><Icon /></a>
                    ) : (
                      <span aria-label={`${item.label} (به‌زودی)`} role="img" title="به‌زودی"><Icon /></span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="b-footer__legal">
          <span>© ۱۴۰۵ ات‌مت</span>
          <span>{copy.origin}</span>
        </div>
      </footer>
    </BrineMotion>
  );
}
