/**
 * Every factual line below is read off the approved brine label wrap
 * (`گسترده لیبل ات مت . اصلاحیه 2 خرداد-05.jpg`). Creative lines are marked.
 */
const NET_WEIGHT = '۱۸۰';

export const brineCopy = {
  /* creative */
  headline: ['یه ذره نمک.', 'یه دنیا مزه.'],
  giant: 'BRINE',
  name: 'کنسرو ماهی تن در آب‌نمک',
  netWeight: NET_WEIGHT,
  /* Product facts from the label; serving suggestions are creative, not tested recipes. */
  description: 'یه ذره نمک، کنار طعم ماهی. ات‌مت در آب‌نمک، ترکیبی از فیلهٔ روشن ماهی تن، آب و نمک است؛ برای وقتی که می‌خواهی مزهٔ غذایت را خودت بسازی، از یک سالاد رنگی تا ساندویچی به سلیقهٔ خودت.',
  steps: [
    { id: 'fish', numeral: '۰۱', title: 'ماهی', fact: 'فیلهٔ روشن ماهی هوور یا گیدر.' },
    { id: 'water', numeral: '۰۲', title: 'آب', fact: 'آب آشامیدنی، همراه ماهی و نمک.' },
    { id: 'salt', numeral: '۰۳', title: 'نمک', fact: 'محلول نمک ۱٫۵٪، مطابق ترکیبات لیبل.' },
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
    { figure: '۲۰', unit: 'دقیقه', text: 'قوطی را پیش از مصرف به مدت ۲۰ دقیقه در آب بجوشانید.' },
    { figure: NET_WEIGHT, unit: 'گرم', text: 'وزن خالص محتویات قوطی، شامل ماهی و آب‌نمک.' },
    { figure: '۷۲٪', unit: 'وزن آبکش', text: 'با جدا کردن آب‌نمک، حدود ۱۳۰ گرم ماهی تن برای سرو می‌ماند.' },
  ],
  storage: 'در جای خشک و خنک نگهداری کنید.',
  warning: 'از مصرف قوطی بادکرده و زنگ‌زده خودداری کنید.',
  origin: 'ساخت ایران',
  recipes: {
    title: ['باهاش', 'چی بپزیم؟'],
    note: 'نمونه‌اند، نه رسپی آزمایش‌شده.',
    items: [
      { id: 'salad', numeral: '۰۱', title: 'سالاد', line: 'برگ تازه، لیمو، تن سرد.', href: '/recipes/tuna-cucumber-salad', image: 'brine-idea-salad' },
      { id: 'sandwich', numeral: '۰۲', title: 'ساندویچ', line: 'نان برشته، سبزی، تن.', href: '/recipes/tuna-pickle-sandwich', image: 'brine-idea-sandwich' },
      { id: 'pasta', numeral: '۰۳', title: 'پاستا', line: 'پاستا، گوجه، تن.', href: '/recipes/tuna-tomato-pasta', image: 'brine-idea-pasta' },
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
