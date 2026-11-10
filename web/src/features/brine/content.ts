/**
 * Every factual line below is read off the approved brine label wrap
 * (`گسترده لیبل ات مت . اصلاحیه 2 خرداد-05.jpg`). Creative lines are marked.
 */
const NET_WEIGHT = '۱۸۰';

export const brineCopy = {
  /* creative */
  headline: ['طعم ماهی،', 'چاشنی با تو.'],
  giant: 'BRINE',
  name: 'کنسرو ماهی تن در آب‌نمک',
  netWeight: NET_WEIGHT,
  /* Product facts from the label; serving suggestions are creative, not tested recipes. */
  description: 'فیلهٔ روشن تن ماهی ات‌مت در آب‌نمک را با چاشنی دلخواهت سرو کن. آب‌لیمو و شوید برای سالاد خیار، یا خیارشور و سس مایونز برای ساندویچ با نان برشته.',
  steps: [
    { id: 'fish', numeral: '۰۱', title: 'ماهی', fact: 'فیلهٔ روشن ماهی هوور یا گیدر.' },
    { id: 'water', numeral: '۰۲', title: 'آب', fact: 'آب آشامیدنی برای تهیهٔ آب‌نمک.' },
    { id: 'salt', numeral: '۰۳', title: 'نمک', fact: 'محلول نمک ۱٫۵٪، مطابق برچسب قوطی.' },
  ],
  nutrition: {
    serving: 'هر وعده ۶۰ گرم',
    /* level follows the label's own traffic-light coding */
    rows: [
      { name: 'انرژی', value: '۵۴٫۵۰', unit: 'کیلوکالری', level: null },
      { name: 'قند', value: '۰', unit: 'گرم', level: 'low' },
      { name: 'چربی', value: '۰', unit: 'گرم', level: 'low' },
      { name: 'نمک', value: '۱٫۰۴', unit: 'گرم', level: 'high' },
      { name: 'اسیدهای چرب ترانس', value: '۰', unit: 'گرم', level: 'low' },
    ],
    legend: [
      { level: 'low', label: 'اندک' },
      { level: 'mid', label: 'متوسط' },
      { level: 'high', label: 'زیاد' },
    ],
  },
  notes: [
    { figure: '۲۰', unit: 'دقیقه', text: 'پیش از مصرف، قوطی را ۲۰ دقیقه در آب بجوشانید.' },
    { figure: NET_WEIGHT, unit: 'گرم', text: 'وزن ماهی و آب‌نمک داخل قوطی.' },
    { figure: '۷۲٪', unit: 'وزن آبکش', text: 'پس از جدا کردن آب‌نمک، حدود ۱۳۰ گرم ماهی در هر قوطی می‌ماند.' },
  ],
  storage: 'در جای خشک و خنک نگهداری کنید.',
  warning: 'از مصرف قوطی بادکرده و زنگ‌زده خودداری کنید.',
  origin: 'ساخت ایران',
  recipes: {
    title: ['از سالاد خیار', 'تا پاستای گوجه.'],
    note: 'برای ناهار سرد، تن در آب‌نمک را با خیار و شوید سرو کن. اگر غذای گرم می‌خواهی، پاستای گوجه و سیر را امتحان کن.',
    items: [
      { id: 'salad', numeral: '۰۱', title: 'سالاد تن و خیار', line: 'خیار و تربچهٔ ترد با شوید تازه و آب‌لیمو.', href: '/recipes/tuna-cucumber-salad', image: 'brine-idea-salad' },
      { id: 'sandwich', numeral: '۰۲', title: 'ساندویچ خیارشور', line: 'تن ماهی و خیارشور با مایونز، لای نان برشته.', href: '/recipes/tuna-pickle-sandwich', image: 'brine-idea-sandwich' },
      { id: 'pasta', numeral: '۰۳', title: 'پاستای تن و گوجه', line: 'پنه یا ریگاتونی با گوجهٔ گیلاسی، سیر و جعفری.', href: '/recipes/tuna-tomato-pasta', image: 'brine-idea-pasta' },
    ],
  },
  /* phone and email are printed on the label */
  contact: {
    phone: { label: '۰۲۱ ۴۴۳۶ ۰۲۱۷', href: 'tel:+982144360217' },
    email: { label: 'crm@at-mat.ir', href: 'mailto:crm@at-mat.ir' },
  },
} as const;

/**
 * Official profile URLs were not supplied. Leave `href` null until they are;
 * the footer renders null entries as inactive.
 */
export const brineSocial: ReadonlyArray<{ id: 'instagram' | 'linkedin' | 'x'; label: string; href: string | null }> = [
  { id: 'instagram', label: 'اینستاگرام', href: null },
  { id: 'linkedin', label: 'لینکدین', href: null },
  { id: 'x', label: 'ایکس', href: null },
];

export type NutritionLevel = 'low' | 'mid' | 'high';
