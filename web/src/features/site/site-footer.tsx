import { BrandEdge } from '@/features/brine/brand-edge';
import { brineCopy, brineSocial } from '@/features/brine/content';
import { ArrowUpIcon, InstagramIcon, LinkedinIcon, MailIcon, PhoneIcon, XIcon } from '@/features/brine/icons';
import { flavors } from '@/features/products/catalog';
import { siteLinks } from './site-links';
import './site-chrome.css';

const socialIcons = { instagram: InstagramIcon, linkedin: LinkedinIcon, x: XIcon } as const;

export function SiteFooter({ logo, flavor, headline = brineCopy.headline }: {
  logo: string; flavor?: string; headline?: readonly string[];
}) {
  const { contact } = brineCopy;
  return (
    <footer className="b-footer" id="site-footer">
      <BrandEdge id="footer-logo-start" className="b-footer__edge" />
      <div className="b-footer__top" id="site-about">
        <a className="b-footer__logo" href="/" aria-label="ات‌مت، صفحهٔ اصلی"><img src={logo} alt="" width={700} height={447} loading="lazy" /></a>
        <div><p className="b-footer__line">{headline.map(line => <span key={line}>{line}</span>)}</p><p className="b-footer__about">کنسرو ماهی تن ات‌مت؛ طعم‌های مختلف، به سلیقهٔ تو.</p></div>
        <a className="b-footer__up" href="#main-content" aria-label="بالای صفحه"><ArrowUpIcon /></a>
      </div>
      <div className="b-footer__grid">
        <div className="b-footer__col"><h2>دسترسی راحت</h2><ul className="b-footer__pages">{siteLinks.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul></div>
        <div className="b-footer__col" id="site-flavors"><h2>طعم‌های ات‌مت</h2><ul className="b-footer__pages">{flavors.map(product => <li key={product.slug}><a href={`/flavors/${product.slug}`} aria-current={product.slug === flavor ? 'page' : undefined}>{product.label}</a></li>)}</ul></div>
        <div className="b-footer__col"><h2>ارتباط با ما</h2><ul className="b-footer__icons">
          <li><a href={contact.phone.href} aria-label={`تماس تلفنی، ${contact.phone.label}`} title={contact.phone.label}><PhoneIcon /></a></li>
          <li><a href={contact.email.href} aria-label={`ایمیل، ${contact.email.label}`} title={contact.email.label}><MailIcon /></a></li>
          {brineSocial.map(item => { const Icon = socialIcons[item.id]; return <li key={item.id}>{item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}><Icon /></a> : <span aria-label={`${item.label} (به‌زودی)`} role="img" title="به‌زودی"><Icon /></span>}</li>; })}
        </ul></div>
      </div>
      <div className="b-footer__legal"><span>© ۱۴۰۵ ات‌مت</span><span>{brineCopy.origin}</span></div>
    </footer>
  );
}
