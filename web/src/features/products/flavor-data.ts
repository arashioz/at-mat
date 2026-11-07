import { brineCopy } from '@/features/brine/content';
import type { FlavorDefinition } from './types';

/**
 * Verified against the original packaging JPGs in Brand Assets /:
 * sunflower: گسترده لیبل ات مت . اصلاحیه 2 خرداد-07.jpg (lid -14)
 * olive oil: گسترده لیبل ات مت . اصلاحیه 2 خرداد-02.jpg (lid -09)
 * Nutrition is per 60 g; traffic-light levels follow each printed table.
 * Palette colors are working image samples and derived UI shades, not official brand HEX.
 * Headlines, descriptions and serving ideas are creative copy, not tested recipes.
 * Contact, origin, storage and warnings were re-read on both oil labels.
 */
const commonCopy = {
  netWeight: '۱۸۰',
  storage: brineCopy.storage,
  warning: brineCopy.warning,
  origin: brineCopy.origin,
  contact: brineCopy.contact,
  recipes: brineCopy.recipes,
};
const legend = brineCopy.nutrition.legend;
const oilNotes = [
  { figure: '۲۰', unit: 'دقیقه', text: 'قوطی را پیش از مصرف به مدت ۲۰ دقیقه در آب بجوشانید.' },
  { figure: '۱۸۰', unit: 'گرم', text: 'وزن خالص محتویات قوطی، شامل ماهی و مایع همراه آن.' },
  { figure: '۷۲٪', unit: 'وزن آبکش', text: 'وزن ماهی پس از جداکردن مایع، حدود ۱۳۰ گرم از هر قوطی است.' },
] as const;

/**
 * Remaining labels: pepper -03 / lid -10, smoked -04 / lid -11, dill -06 / lid -13.
 * Nutrition values and colour levels are transcribed from their 60 g tables.
 * Smoked uses natural smoke flavour; the label makes no smoking-method claim.
 * Dill's drained weight is 74%, unlike the other two labels' 72%.
 * The full original artwork is resized only, then uploaded through the storage API.
 */
const flavoredOilSteps = [
  { id: 'fish', title: 'ماهی', fact: 'فیلهٔ روشن ماهی هوور یا گیدر.' },
  { id: 'oil', title: 'روغن و آب‌نمک', fact: 'روغن آفتابگردان، آب آشامیدنی و محلول نمک ۱٫۵٪.' },
] as const;

function flavoredNutrition(energy: string, fat: string, salt: string) {
  return {
    serving: 'هر وعده ۶۰ گرم',
    rows: [
      { name: 'انرژی', value: energy, unit: 'کیلوکالری', level: null },
      { name: 'قند', value: '۰', unit: 'گرم', level: 'low' },
      { name: 'چربی', value: fat, unit: 'گرم', level: 'high' },
      { name: 'نمک', value: salt, unit: 'گرم', level: 'high' },
      { name: 'اسیدهای چرب ترانس', value: '۰٫۰۶', unit: 'گرم', level: 'low' },
    ],
    legend,
  } as const;
}

export const pepperFlavor: FlavorDefinition = {
  slug: 'pepper',
  mediaPrefix: 'pepper',
  label: 'فلفلی',
  metadataTitle: 'تن ماهی فلفلی در روغن آفتابگردان',
  copy: {
    ...commonCopy,
    headline: ['یه کم تندتر.', 'یه دنیا مزه.'],
    giant: 'CHILI',
    name: 'کنسرو ماهی تن در روغن آفتابگردان با طعم فلفل',
    description: 'برای وقتی که دلت کمی تندی می‌خواهد. فیلهٔ روشن ماهی تن، روغن آفتابگردان و فلفل قرمز، همراه آب و نمک؛ یک قوطی ۱۸۰ گرمی برای کسادیای پنیری، برنج تابه‌ای یا املتی به سلیقهٔ خودت.',
    steps: [...flavoredOilSteps, { id: 'pepper', title: 'فلفل قرمز', fact: 'فلفل قرمز، مطابق ترکیبات روی بسته‌بندی.' }],
    nutrition: flavoredNutrition('۱۶۷٫۲۲', '۱۱٫۱۲', '۱٫۱۹'),
    notes: oilNotes,
    recipes: {
      title: ['یه کم تندی،', 'کلی ایده.'],
      note: 'سه ایده با تن فلفلی؛ دستور هر کدام را ببین.',
      items: [
        { id: 'quesadilla', numeral: '۰۱', title: 'کسادیا', line: 'تن فلفلی، ذرت و پنیر کش‌دار.', href: '/recipes/chili-tuna-corn-quesadilla', image: 'recipe-chili-tuna-corn-quesadilla-cover-a' },
        { id: 'rice', numeral: '۰۲', title: 'برنج تابه‌ای', line: 'برنج، تخم‌مرغ و یک طعم تند.', href: '/recipes/chili-tuna-egg-fried-rice', image: 'recipe-chili-tuna-egg-fried-rice-cover-a' },
        { id: 'eggs', numeral: '۰۳', title: 'املت فلفلی', line: 'گوجه، تخم‌مرغ، تن فلفلی.', href: '/recipes/chili-tuna-tomato-eggs', image: 'recipe-chili-tuna-tomato-eggs-cover-a' },
      ],
    },
  },
  theme: {
    accent: '#b50920', deep: '#790519', navy: '#350910', pale: '#fff0ed', notes: '#f9dfd8',
    heroTop: '#bf0b22', heroBottom: '#850416', heroGlow: 'rgb(255 82 54 / 0.3)',
    light: [1, 0.3, 0.22],
  },
};

export const smokedFlavor: FlavorDefinition = {
  slug: 'smoked',
  mediaPrefix: 'smoked',
  label: 'دودی',
  metadataTitle: 'تن ماهی با طعم طبیعی دود',
  copy: {
    ...commonCopy,
    headline: ['یه طعم دودی.', 'یه حس متفاوت.'],
    giant: 'SMOKY',
    name: 'کنسرو ماهی تن در روغن آفتابگردان با طعم طبیعی دود',
    description: 'این بار، طعم آشنای ماهی با حال‌وهوای دودی. فیلهٔ روشن ماهی تن در روغن آفتابگردان با طعم‌دهندهٔ طبیعی دود، همراه آب و نمک؛ برای یک ساندویچ گرم، پیتزای لواش یا یک کاسه سوپ.',
    steps: [...flavoredOilSteps, { id: 'smoke', title: 'طعم دود', fact: 'طعم‌دهندهٔ طبیعی دود، مطابق ترکیبات روی بسته‌بندی.' }],
    nutrition: flavoredNutrition('۱۷۴٫۰۶', '۱۱٫۹۴', '۱٫۰۶'),
    notes: oilNotes,
    recipes: {
      title: ['طعم دودی،', 'ایده‌های گرم.'],
      note: 'سه ایده با تن دودی؛ دستور هر کدام را ببین.',
      items: [
        { id: 'melt', numeral: '۰۱', title: 'ساندویچ چدار', line: 'نان برشته، چدار و تن دودی.', href: '/recipes/smoked-tuna-cheddar-melt', image: 'recipe-smoked-tuna-cheddar-melt-cover-a' },
        { id: 'pizza', numeral: '۰۲', title: 'پیتزای لواش', line: 'قارچ، موزارلا و یک نان ترد.', href: '/recipes/smoked-tuna-mushroom-lavash-pizza', image: 'recipe-smoked-tuna-mushroom-lavash-pizza-cover-a' },
        { id: 'soup', numeral: '۰۳', title: 'سوپ ذرت', line: 'یک کاسه گرم با طعم دود.', href: '/recipes/smoked-tuna-corn-potato-soup', image: 'recipe-smoked-tuna-corn-potato-soup-cover-a' },
      ],
    },
  },
  theme: {
    accent: '#a74610', deep: '#71320d', navy: '#291c16', pale: '#f5eee6', notes: '#ede0d1',
    heroTop: '#30302e', heroBottom: '#171715', heroGlow: 'rgb(227 110 25 / 0.19)',
    light: [1, 0.52, 0.2],
  },
};

export const dillFlavor: FlavorDefinition = {
  slug: 'dill',
  mediaPrefix: 'dill',
  label: 'شویدی',
  metadataTitle: 'تن ماهی در روغن آفتابگردان با شوید',
  copy: {
    ...commonCopy,
    headline: ['عطر شوید.', 'مزهٔ یه حال خوب.'],
    giant: 'DILL',
    name: 'کنسرو ماهی تن در روغن آفتابگردان با شوید',
    description: 'عطر شوید، کنار طعم ماهی. فیلهٔ روشن ماهی تن در روغن آفتابگردان، همراه شوید، آب و نمک؛ یک قوطی ۱۸۰ گرمی برای سالاد ماکارونی، کوکو سبزی یا کدوی شکم‌پر به سلیقهٔ تو.',
    steps: [...flavoredOilSteps, { id: 'dill', title: 'شوید', fact: 'شوید، مطابق ترکیبات روی بسته‌بندی.' }],
    nutrition: flavoredNutrition('۱۶۷٫۸۵', '۱۲٫۷۶', '۱٫۱۸'),
    notes: [
      oilNotes[0], oilNotes[1],
      { figure: '۷۴٪', unit: 'وزن آبکش', text: 'وزن آبکش درج‌شده روی این بسته‌بندی، معادل حدود ۱۳۳ گرم در هر قوطی است.' },
    ],
    recipes: {
      title: ['عطر سبز،', 'سر سفرهٔ تو.'],
      note: 'سه ایده با تن شویدی؛ دستور هر کدام را ببین.',
      items: [
        { id: 'pasta-salad', numeral: '۰۱', title: 'سالاد ماکارونی', line: 'ماکارونی، نخودفرنگی و تن شویدی.', href: '/recipes/dill-tuna-pea-pasta-salad', image: 'recipe-dill-tuna-pea-pasta-salad-cover-a' },
        { id: 'kuku', numeral: '۰۲', title: 'کوکو سبزی', line: 'سبزی، تخم‌مرغ و عطر شوید.', href: '/recipes/dill-tuna-herb-kuku', image: 'recipe-dill-tuna-herb-kuku-cover-a' },
        { id: 'zucchini', numeral: '۰۳', title: 'کدوی شکم‌پر', line: 'کدو، پنیر و تکه‌های تن شویدی.', href: '/recipes/dill-tuna-stuffed-zucchini', image: 'recipe-dill-tuna-stuffed-zucchini-cover-a' },
      ],
    },
  },
  theme: {
    accent: '#007f4b', deep: '#005637', navy: '#063b29', pale: '#eaf5e9', notes: '#dcefd5',
    heroTop: '#00975b', heroBottom: '#00613e', heroGlow: 'rgb(108 222 139 / 0.22)',
    light: [0.3, 0.9, 0.55],
  },
};

export const sunflowerFlavor: FlavorDefinition = {
  slug: 'sunflower',
  mediaPrefix: 'sunflower',
  label: 'روغن آفتابگردان',
  metadataTitle: 'تن ماهی در روغن آفتابگردان',
  copy: {
    ...commonCopy,
    headline: ['طلایی و آشنا.', 'برای سفرهٔ تو.'],
    giant: 'SUNFLOWER',
    name: 'کنسرو ماهی تن در روغن آفتابگردان',
    description: 'طعم آشنای ماهی، همراه روغن آفتابگردان. فیلهٔ روشن ماهی تن در یک قوطی ۱۸۰ گرمی، با آب آشامیدنی و محلول نمک؛ برای کنار یک سالاد رنگی، میان ساندویچ یا همراه پاستایی به سلیقهٔ خودت.',
    steps: [
      { id: 'fish', title: 'ماهی', fact: 'فیلهٔ روشن ماهی هوور یا گیدر.' },
      { id: 'oil', title: 'روغن آفتابگردان', fact: 'روغن گیاهی آفتابگردان، همراه ماهی.' },
      { id: 'water-salt', title: 'آب و نمک', fact: 'آب آشامیدنی و محلول نمک ۱٫۵٪.' },
    ],
    nutrition: {
      serving: 'هر وعده ۶۰ گرم',
      rows: [
        { name: 'انرژی', value: '۱۶۷٫۲۶', unit: 'کیلوکالری', level: null },
        { name: 'قند', value: '۰', unit: 'گرم', level: 'low' },
        { name: 'چربی', value: '۱۱٫۱۲', unit: 'گرم', level: 'high' },
        { name: 'نمک', value: '۱٫۱۹', unit: 'گرم', level: 'high' },
        { name: 'اسیدهای چرب ترانس', value: '۰٫۰۶', unit: 'گرم', level: 'low' },
      ],
      legend,
    },
    notes: oilNotes,
  },
  theme: {
    accent: '#9b7100',
    deep: '#705000',
    navy: '#302407',
    pale: '#fff8df',
    notes: '#fffaf0',
    heroText: '#302407',
    heroTop: '#fcc000',
    heroBottom: '#d8a400',
    heroGlow: 'rgb(255 224 0 / 0.38)',
    light: [1, 0.82, 0.18],
  },
};

export const oliveOilFlavor: FlavorDefinition = {
  slug: 'olive-oil',
  mediaPrefix: 'olive-oil',
  label: 'روغن زیتون',
  metadataTitle: 'تن ماهی در روغن زیتون',
  copy: {
    ...commonCopy,
    headline: ['با روغن زیتون.', 'با سلیقهٔ تو.'],
    giant: 'OLIVE OIL',
    name: 'کنسرو ماهی تن در روغن زیتون',
    description: 'ماهی و روغن زیتون، کنار هم. فیلهٔ روشن ماهی تن در یک قوطی ۱۸۰ گرمی، همراه آب آشامیدنی و محلول نمک؛ ترکیبی برای وقتی که می‌خواهی سالاد یا ساندویچت را به سلیقهٔ خودت بسازی.',
    steps: [
      { id: 'fish', title: 'ماهی', fact: 'فیلهٔ روشن ماهی هوور یا گیدر.' },
      { id: 'oil', title: 'روغن زیتون', fact: 'روغن زیتون، همراه فیلهٔ روشن ماهی.' },
      { id: 'water-salt', title: 'آب و نمک', fact: 'آب آشامیدنی و محلول نمک ۱٫۵٪.' },
    ],
    nutrition: {
      serving: 'هر وعده ۶۰ گرم',
      rows: [
        { name: 'انرژی', value: '۱۷۵٫۵', unit: 'کیلوکالری', level: null },
        { name: 'قند', value: '۰', unit: 'گرم', level: 'low' },
        { name: 'چربی', value: '۹٫۱۸', unit: 'گرم', level: 'mid' },
        { name: 'نمک', value: '۰٫۸۳', unit: 'گرم', level: 'mid' },
        { name: 'اسیدهای چرب ترانس', value: '۰', unit: 'گرم', level: 'low' },
      ],
      legend,
    },
    notes: oilNotes,
  },
  theme: {
    accent: '#647400',
    deep: '#343c00',
    navy: '#202600',
    pale: '#f3f5e7',
    notes: '#f8f8ef',
    heroTop: '#647400',
    heroBottom: '#343c00',
    heroGlow: 'rgb(164 184 44 / 0.3)',
    light: [0.64, 0.72, 0.17],
  },
};
