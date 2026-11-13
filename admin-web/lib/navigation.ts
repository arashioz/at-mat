import type { Role } from './api';
import type { IconName } from '../components/AdminIcon';

type NavItem = {
  href: string; label: string; short?: string; icon: IconName; description: string;
  group: 'workspace' | 'content' | 'operations' | 'account';
  roles?: readonly Role[]; feature?: string;
};

export const ADMIN_ROLES: readonly Role[] = ['admin', 'super_admin'];
export const CUSTOMER_EDITORS: readonly Role[] = [...ADMIN_ROLES, 'sales_manager'];
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'پیشخوان', icon: 'home', group: 'workspace', description: 'نمای کلی میز کار' },
  { href: '/articles', label: 'مقالات', icon: 'article', group: 'content', roles: ADMIN_ROLES, description: 'نوشتن، ویرایش و انتشار در مجلهٔ ات‌مت' },
  { href: '/recipes', label: 'رسپی‌ها', icon: 'recipe', group: 'content', roles: ADMIN_ROLES, description: 'مدیریت دستور پخت، عکس‌ها و اطلاعات هر رسپی' },
  { href: '/library', label: 'کتابخانهٔ رسانه', short: 'رسانه‌ها', icon: 'media', group: 'content', roles: ADMIN_ROLES, description: 'انتخاب و بارگذاری تصاویر سایت' },
  { href: '/brand-book', label: 'برند بوک', icon: 'book', group: 'content', roles: ADMIN_ROLES, description: 'هویت، دارایی‌ها و استراتژی بازاریابی ات‌مت' },
  { href: '/customers', label: 'مشتریان', icon: 'customers', group: 'operations', roles: [...CUSTOMER_EDITORS, 'marketer'], feature: 'crm.customers', description: 'فهرست و ثبت اطلاعات مشتریان' },
  { href: '/products', label: 'محصولات', icon: 'products', group: 'operations', roles: [...ADMIN_ROLES, 'sales_manager', 'marketer', 'distribution_agent'], feature: 'erp.products', description: 'فهرست کالاها، قیمت و موجودی' },
  { href: '/collaboration', label: 'درخواست‌های همکاری', icon: 'inbox', group: 'operations', roles: ADMIN_ROLES, description: 'بررسی درخواست‌های نمایندگی فروش و استخدام' },
  { href: '/account', label: 'حساب کاربری', short: 'حساب', icon: 'account', group: 'account', description: 'مشخصات حساب و تغییر رمز عبور' },
];

export function canOpen(item: NavItem, role: Role, features: Record<string, boolean>) {
  return (!item.roles || item.roles.includes(role)) && (!item.feature || features[item.feature] !== false);
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
