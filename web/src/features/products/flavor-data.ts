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
};
const legend = brineCopy.nutrition.legend;
const oilNotes = [
  brineCopy.notes[0],
  { figure: '۱۸۰', unit: 'گرم', text: 'وزن ماهی و مایع داخل قوطی.' },
  { figure: '۷۲٪', unit: 'وزن آبکش', text: 'پس از آبکش کردن، حدود ۱۳۰ گرم ماهی در هر قوطی می‌ماند.' },
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
    headline: ['فلفل قرمز.', 'لقمهٔ تندتر.'],
    giant: 'CHILI',
    name: 'کنسرو ماهی تن در روغن آفتابگردان با طعم فلفل',
    description: 'فلفل قرمز به فیلهٔ روشن تن ماهی ات‌مت در روغن آفتابگردان تندی می‌دهد. آن را با ذرت و چدار لای نان تورتیلای برشته امتحان کن.',
    steps: [...flavoredOilSteps, { id: 'pepper', title: 'فلفل قرمز', fact: 'فلفل قرمز چاشنی این طعم است.' }],
    nutrition: flavoredNutrition('۱۶۷٫۲۲', '۱۱٫۱۲', '۱٫۱۹'),
    notes: oilNotes,
    recipes: {
      title: ['یک تابه،', 'چند لقمهٔ تند.'],
      note: 'تن فلفلی را با پنیر در نان برشته کن یا به برنج و املت تابه‌ای اضافه کن.',
      items: [
        { id: 'quesadilla', numeral: '۰۱', title: 'کسادیای تن فلفلی', line: 'تورتیلای برشته با ذرت و چدارِ آب‌شده.', href: '/recipes/chili-tuna-corn-quesadilla', image: 'recipe-chili-tuna-corn-quesadilla-cover-a' },
        { id: 'rice', numeral: '۰۲', title: 'برنج تابه‌ای', line: 'تن فلفلی، تخم‌مرغ و پیازچه با چاشنی سویا.', href: '/recipes/chili-tuna-egg-fried-rice', image: 'recipe-chili-tuna-egg-fried-rice-cover-a' },
        { id: 'eggs', numeral: '۰۳', title: 'املت گوجه', line: 'تخم‌مرغ و تن فلفلی در سس گوجه و فلفل دلمه‌ای.', href: '/recipes/chili-tuna-tomato-eggs', image: 'recipe-chili-tuna-tomato-eggs-cover-a' },
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
    headline: ['طعم دود،', 'روی نان برشته.'],
    giant: 'SMOKY',
    name: 'کنسرو ماهی تن در روغن آفتابگردان با طعم طبیعی دود',
    description: 'فیلهٔ روشن تن ماهی ات‌مت در روغن آفتابگردان با طعم‌دهندهٔ طبیعی دود. با چدارِ آب‌شده در نان برشته سرو کن یا به سوپ ذرت و سیب‌زمینی اضافه‌اش کن.',
    steps: [...flavoredOilSteps, { id: 'smoke', title: 'طعم دود', fact: 'طعم‌دهندهٔ طبیعی دود، طبق برچسب قوطی.' }],
    nutrition: flavoredNutrition('۱۷۴٫۰۶', '۱۱٫۹۴', '۱٫۰۶'),
    notes: oilNotes,
    recipes: {
      title: ['شام گرم', 'با طعم دود.'],
      note: 'تن دودی کنار چدار و نان برشته یک ساندویچ گرم می‌شود. برای شامی که با قاشق می‌خوری، سوپ ذرت را ببین.',
      items: [
        { id: 'melt', numeral: '۰۱', title: 'ساندویچ چدار', line: 'تن دودی و چدارِ آب‌شده میان نان برشته.', href: '/recipes/smoked-tuna-cheddar-melt', image: 'recipe-smoked-tuna-cheddar-melt-cover-a' },
        { id: 'pizza', numeral: '۰۲', title: 'پیتزای لواش', line: 'تن دودی، قارچ و موزارلا روی لواش ترد.', href: '/recipes/smoked-tuna-mushroom-lavash-pizza', image: 'recipe-smoked-tuna-mushroom-lavash-pizza-cover-a' },
        { id: 'soup', numeral: '۰۳', title: 'سوپ ذرت', line: 'ذرت و سیب‌زمینی با شیر، پیازچه و تن دودی.', href: '/recipes/smoked-tuna-corn-potato-soup', image: 'recipe-smoked-tuna-corn-potato-soup-cover-a' },
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
    headline: ['عطر شوید.', 'امشب کوکو؟'],
    giant: 'DILL',
    name: 'کنسرو ماهی تن در روغن آفتابگردان با شوید',
    description: 'شوید به فیلهٔ روشن تن ماهی ات‌مت در روغن آفتابگردان عطر می‌دهد. این طعم به کوکو سبزی می‌آید و با ماکارونی، خیار و نخودفرنگی هم یک سالاد سرد می‌سازد.',
    steps: [...flavoredOilSteps, { id: 'dill', title: 'شوید', fact: 'عطر این طعم از شوید می‌آید.' }],
    nutrition: flavoredNutrition('۱۶۷٫۸۵', '۱۲٫۷۶', '۱٫۱۸'),
    notes: [
      oilNotes[0], oilNotes[1],
      { figure: '۷۴٪', unit: 'وزن آبکش', text: 'پس از آبکش کردن، حدود ۱۳۳ گرم ماهی در هر قوطی می‌ماند.' },
    ],
    recipes: {
      title: ['از سالاد سرد', 'تا کوکوی گرم.'],
      note: 'سالاد ماکارونی را سرد سرو کن. برای شام، کوکو سبزی یا کدوی شکم‌پر را با تن شویدی امتحان کن.',
      items: [
        { id: 'pasta-salad', numeral: '۰۱', title: 'سالاد ماکارونی', line: 'خیار و نخودفرنگی با تن شویدی و سس ماست.', href: '/recipes/dill-tuna-pea-pasta-salad', image: 'recipe-dill-tuna-pea-pasta-salad-cover-a' },
        { id: 'kuku', numeral: '۰۲', title: 'کوکو سبزی', line: 'جعفری، گشنیز و اسفناج با تخم‌مرغ و تن شویدی.', href: '/recipes/dill-tuna-herb-kuku', image: 'recipe-dill-tuna-herb-kuku-cover-a' },
        { id: 'zucchini', numeral: '۰۳', title: 'کدوی شکم‌پر', line: 'کدوهای پرشده با تن شویدی و رویهٔ موزارلا.', href: '/recipes/dill-tuna-stuffed-zucchini', image: 'recipe-dill-tuna-stuffed-zucchini-cover-a' },
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
    headline: ['یک طعم آشنا.', 'از پلو تا نودل.'],
    giant: 'SUNFLOWER',
    name: 'کنسرو ماهی تن در روغن آفتابگردان',
    description: 'فیلهٔ روشن تن ماهی ات‌مت در روغن آفتابگردان، همان طعم آشنای کنار پلو. این بار آن را با نودل کنجدی یا زیر یک لایه پورهٔ سیب‌زمینی امتحان کن.',
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
    recipes: {
      title: ['سالاد خنک', 'یا نودل تابه‌ای؟'],
      note: 'تن آفتابگردان را با آووکادو و ذرت در سالاد سرو کن. اگر غذای گرم می‌خواهی، نودل کنجدی یا پای سیب‌زمینی را ببین.',
      items: [
        { id: 'avocado-salad', numeral: '۰۱', title: 'سالاد تن و آووکادو', line: 'آووکادو، ذرت و خیار با چاشنی لیمو و گشنیز.', href: '/recipes/sunflower-tuna-avocado-corn-salad', image: 'recipe-sunflower-tuna-avocado-corn-salad-cover-a' },
        { id: 'sesame-noodles', numeral: '۰۲', title: 'نودل کنجدی با تن', line: 'کلم و هویج تابه‌ای با کنجد بوداده و سس سویا.', href: '/recipes/sunflower-tuna-sesame-vegetable-noodles', image: 'recipe-sunflower-tuna-sesame-vegetable-noodles-cover-a' },
        { id: 'potato-pie', numeral: '۰۳', title: 'پای تن و سیب‌زمینی', line: 'تن، هویج و نخودفرنگی زیر پورهٔ برشته.', href: '/recipes/sunflower-tuna-potato-pie', image: 'recipe-sunflower-tuna-potato-pie-cover-a' },
      ],
    },
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
    headline: ['روغن زیتون.', 'طعم مدیترانه.'],
    giant: 'OLIVE OIL',
    name: 'کنسرو ماهی تن در روغن زیتون',
    description: 'فیلهٔ روشن تن ماهی ات‌مت در روغن زیتون را با لیمو و لوبیا سبز در سالاد نیشواز امتحان کن. برای یک بشقاب گرم، سراغ اسپاگتی با گوجه و زیتون برو.',
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
    recipes: {
      title: ['سالاد نیشواز', 'یا اسپاگتی؟'],
      note: 'لیمو و خردل چاشنی سالاد نیشوازند. اگر پاستا دوست داری، زیتون و کیپر کنار تن در روغن زیتون خوب می‌نشینند.',
      items: [
        { id: 'nicoise', numeral: '۰۱', title: 'سالاد نیشواز با تن', line: 'لوبیا سبز، سیب‌زمینی و تخم‌مرغ با چاشنی لیمو و خردل.', href: '/recipes/olive-tuna-nicoise', image: 'recipe-olive-tuna-nicoise-cover-a' },
        { id: 'caper-spaghetti', numeral: '۰۲', title: 'اسپاگتی تن و زیتون', line: 'سس گوجه و سیر با زیتون و کیپر.', href: '/recipes/olive-tuna-caper-spaghetti', image: 'recipe-olive-tuna-caper-spaghetti-cover-a' },
        { id: 'warm-lentils', numeral: '۰۳', title: 'سالاد گرم عدس', line: 'تن و عدس سبز با هویج و چاشنی سرکهٔ سیب.', href: '/recipes/olive-tuna-warm-lentils-carrot', image: 'recipe-olive-tuna-warm-lentils-carrot-cover-a' },
      ],
    },
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
