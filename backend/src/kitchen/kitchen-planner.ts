import type { PublishedRecipe, RecipeFields } from '../recipes/recipe.types';
import { toAsciiDigits } from '../common/utils/phone.util';
import type { KitchenMessage, KitchenRecipe, KitchenReply } from './kitchen.types';

export const normalize = (text: string) => toAsciiDigits(text).replace(/ي/g, 'ی').replace(/ك/g, 'ک')
  .replace(/٫/g, '.').replace(/[\u200c\u064b-\u065f]/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
const numberWords: Record<string, number> = {
  صفر: 0, یک: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8,
  نه: 9, ده: 10, یازده: 11, دوازده: 12, سیزده: 13, چهارده: 14, پانزده: 15,
  شانزده: 16, هفده: 17, هجده: 18, نوزده: 19, بیست: 20,
};
const servingsPattern = new RegExp(
  `(?:^|[^\\p{L}\\p{N}.,+−-])([+−-]?\\d+(?:[.,]\\d+)?|${Object.keys(numberWords).join('|')})\\s*نفر(?:ه)?(?=$|[^\\p{L}\\p{N}])`,
  'gu',
);
const fa = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 2 });
const groups = [
  ['ماهی', 'تن ماهی', 'غذای دریایی', 'دریایی'],
  ['لبنیات', 'شیر', 'پنیر', 'ماست', 'خامه', 'کره'],
  ['تخم مرغ', 'مایونز'],
  ['گلوتن', 'گندم', 'نان', 'پاستا', 'ماکارونی', 'کوسکوس', 'آرد', 'نودل'],
  ['سویا', 'سس سویا'], ['کنجد', 'ارده'], ['بادام', 'گردو', 'پسته', 'فندق', 'بادام زمینی'],
];
const common = ['سیب زمینی', 'قارچ', 'پیاز', 'سیر', 'ذرت', 'خیار', 'گوجه', 'شوید', 'فلفل', 'خردل', 'اسفناج'];
const oven = /(?:^|[^\p{L}\p{N}])فر(?=$|[^\p{L}\p{N}])|تنوری/u;
const flavorTerms: Record<Exclude<RecipeFields['flavor'], ''>, RegExp> = {
  brine: /آب\s*نمک/,
  'olive-oil': /روغن زیتون|تن (?:ماهی )?زیتون/,
  sunflower: /آفتاب\s*گردان/,
  pepper: /فلفلی/,
  smoked: /دودی/,
  dill: /شویدی/,
};
const dishTerms = [
  /سالاد/, /ساندویچ|(?:^|\s)رپ(?=$|[^\p{L}\p{N}])/u, /پاستا|ماکارونی|اسپاگتی/, /نودل/,
  /سوپ/, /کوکو/, /املت/, /پیتزا/, /(?:^|\s)پای(?=$|[^\p{L}\p{N}])/u, /خوراک/,
];

function requestedRecipe(input: string) {
  // An ingredient mentioned only as an exclusion should not select a dish or flavor.
  const wanted = input.replace(/(?:بدون|حساسیت به|آلرژی به)\s+[^،؛.!؟]+?(?=$|[،؛.!؟]|\s+(?:با|برای|و بدون)\s)/g, ' ');
  const flavor = Object.entries(flavorTerms).find(([, term]) => term.test(wanted))?.[0];
  const dish = dishTerms.find(term => term.test(wanted));
  return { flavor, dish };
}

export function preferences(messages: KitchenMessage[], prompt: string) {
  const input = normalize(prompt);
  const history = normalize([...messages.filter(m => m.role === 'user').map(m => m.text), prompt].join('؛ '));
  const amounts = [...history.matchAll(servingsPattern)];
  const amount = amounts.at(-1)?.[1];
  const requestedServings = amount ? (numberWords[amount] ?? Number(amount.replace('−', '-').replace(',', '.'))) : 2;
  const invalidServings = !Number.isInteger(requestedServings) || requestedServings < 1 || requestedServings > 12;
  const servings = invalidServings ? 2 : requestedServings;
  const excluded = new Set<string>();
  const restrictions = [...history.matchAll(/(?:بدون|حساسیت به|آلرژی به)\s*([^؛.!؟\n]{1,65})/g)].map(m => m[1]);
  for (const ingredient of [...groups.flat(), ...common]) {
    if (restrictions.some(s => s.includes(ingredient)) || history.includes(`${ingredient} ندارم`) || history.includes(`به ${ingredient} حساسیت`)) {
      const group = groups.find(g => g[0] === ingredient || (history.includes('حساسیت') || history.includes('آلرژی')) && g.includes(ingredient));
      for (const term of group ?? [ingredient]) excluded.add(term);
    }
  }
  const quick = /سریع|فوری|وقت کم|زیر 20|زیر 15/.test(history);
  const vegetarian = /گیاه خوار|وگان|بدون ماهی|بدون تن/.test(history);
  const noOven = /بدون فر|فر ندارم/.test(history);
  return { servings, invalidServings, excluded: [...excluded], quick, vegetarian, noOven, history, ...requestedRecipe(input) };
}

export function recipeAllowed(recipe: PublishedRecipe, excluded: string[]) {
  const text = normalize(recipe.ingredients.join(' '));
  return !excluded.some(term => text.includes(term));
}

export function catalogCandidates(catalog: PublishedRecipe[], prefs: ReturnType<typeof preferences>) {
  return catalog.filter(recipe => {
    if (prefs.flavor && recipe.flavor !== prefs.flavor) return false;
    if (prefs.dish && !prefs.dish.test(normalize(`${recipe.category} ${recipe.title}`))) return false;
    if (!recipeAllowed(recipe, prefs.excluded)) return false;
    return !prefs.noOven || (!oven.test(normalize(recipe.category)) && !usesOven(recipe.steps));
  });
}

export function usesOven(steps: { title: string; text: string }[]) {
  return oven.test(normalize(steps.map(step => `${step.title} ${step.text}`).join(' ')));
}

export function scaleRecipe(source: PublishedRecipe, servings: number): KitchenRecipe {
  const amount = normalize(source.servings).match(/(\d+)\s*(?:نفر|وعده|ساندویچ|رپ)/)?.[1];
  const factor = servings / (Number(amount) || 2);
  const ingredients = source.ingredients.map(line => {
    if (factor === 1) return line;
    let result = line.replace(/^([۰-۹\d]+(?:[٫.][۰-۹\d]+)?)(?:\s+تا\s+([۰-۹\d]+(?:[٫.][۰-۹\d]+)?))?/, (_match, first: string, last?: string) =>
      `${fa(Number(normalize(first)) * factor)}${last ? ` تا ${fa(Number(normalize(last)) * factor)}` : ''}`);
    const fractions: Record<string, number> = { 'یک‌چهارم': .25, 'یک‌سوم': 1 / 3, 'نیم': .5 };
    result = result.replace(/^(یک‌چهارم|یک‌سوم|نیم)/, value => fa(fractions[value] * factor));
    if (/قوطی/.test(result)) result = result.replace(/،\s*((?:[۰-۹\d]|حدود).*)/, '، هر قوطی: $1');
    return result;
  });
  const image = source.photos['cover-a'];
  return {
    title: source.title, sourceSlug: source.slug, sourceTitle: source.title, flavor: source.flavor,
    image: image ? `/media/${image.key}` : null, servings, duration: source.duration, ingredients,
    preparation: source.preparation, steps: source.steps, tip: source.tip,
  };
}

export const storageReply: KitchenReply = {
  mode: 'catalog', recipe: null,
  text: 'غذای پخته را در ظرف کم‌عمق و دربسته، حداکثر تا ۲ ساعت پس از آماده‌سازی داخل یخچال با دمای ۴ درجه یا کمتر بگذار؛ در هوای بالای ۳۲ درجه این زمان ۱ ساعت است. اگر درست سرد و نگهداری شده باشد، معمولاً تا ۳ تا ۴ روز قابل نگهداری است. دستور روی بسته و مواد زودفسادتر را هم در نظر بگیر.\nاگر مدت یا دمای نگهداری نامشخص است، از ظاهر یا بو نتیجه نگیر که غذا سالم است. دربارهٔ غذای مشخصت بگو: چند ساعت مانده و داخل یخچال بوده؟',
  links: [
    { title: 'راهنمای نگهداری غذا · FDA', href: 'https://www.fda.gov/consumers/consumer-updates/are-you-storing-food-safely' },
    { title: 'مدت نگهداری غذای پخته · USDA', href: 'https://ask.fsis.usda.gov/article/How-do-I-handle-leftovers-safely/' },
  ], suggestions: ['لیست خرید این رسپی را بده', 'یک رسپی سریع پیشنهاد بده'],
};

export function planFromCatalog(catalog: PublishedRecipe[], messages: KitchenMessage[], prompt: string): KitchenReply {
  const input = normalize(prompt);
  const prefs = preferences(messages, prompt);
  const previous = [...messages].reverse().find(m => m.reply?.recipe)?.reply?.recipe;
  if (prefs.invalidServings) return { mode: 'catalog', recipe: null, text: 'فعلاً مقدار مواد را برای ۱ تا ۱۲ نفر تنظیم می‌کنم. برای چند نفر در این بازه آماده کنیم؟', links: [], suggestions: ['برای ۲ نفر', 'برای ۴ نفر'] };
  if (/باردار|شیرده|جیوه|بیماری|دیابت|فشار خون|کلیه|نوزاد|مسموم|درمان/.test(input)) return {
    mode: 'catalog', recipe: null, text: 'می‌توانم در انتخاب مواد و روش پخت همراهت باشم، اما مقدار مجاز مصرف یا رژیم مناسب این شرایط را باید با پزشک یا متخصص تغذیه بررسی کنی. اگر محدودیت غذایی مشخصی به تو داده‌اند، همان را بگو تا رسپی‌های مرتبط را پیدا کنیم.', links: [], suggestions: ['رسپی‌های موجود را پیشنهاد بده'],
  };
  if (/نگهداری|نگه داری|یخچال|فریزر|فاسد|خراب|بیرون مانده|بیرون مونده|باد کرده|قوطی باد|قوطی متورم|قوطی زنگ/.test(input)) {
    if (/باد کرده|بادکرده|متورم|نشتی|زنگ/.test(input)) return { ...storageReply, text: 'قوطی متورم، نشتی‌دار یا به‌شدت آسیب‌دیده را مصرف نکن و برای امتحان سالم‌بودنش نچش. جوشاندن، راه مطمئنی برای سالم‌کردن قوطی آسیب‌دیده نیست. برای جایگزین، بستهٔ سالم و تاریخ‌دار انتخاب کن.' };
    return storageReply;
  }
  if (prefs.vegetarian || prefs.excluded.some(x => ['ماهی', 'تن ماهی', 'دریایی'].includes(x))) return {
    mode: 'catalog', recipe: null, text: 'رسپی‌های فعلی ات‌مت همگی تن ماهی دارند و با این محدودیت سازگار نیستند. برای حساسیت به ماهی یا غذای گیاهی، از این مجموعه دستور پیشنهاد نمی‌کنم. اگر منظورت محدودیت دیگری است، دقیق‌تر بنویس.', links: [], suggestions: [],
  };
  if (/حساسیت|آلرژی/.test(prefs.history)) return {
    mode: 'catalog', recipe: null, text: 'برای حساسیت غذایی، اطلاعات فعلی رسپی‌ها برای تأیید ایمنی کافی نیست. ترکیبات و هشدار تماس با مواد حساسیت‌زا روی همهٔ بسته‌ها را بررسی کن و از راهنمایی متخصصت استفاده کن. این نسخه نمی‌تواند یک رسپی را بدون آلرژن تضمین کند.', links: [], suggestions: [],
  };
  if (/آدرس\s*(?:دفتر|شرکت)|شماره\s*(?:تماس|تلفن)/.test(input)) return {
    mode: 'catalog', recipe: null, text: 'راه‌های تماس با تیم ات‌مت در صفحهٔ دربارهٔ ما آمده است.',
    links: [{ title: 'دربارهٔ ما و راه‌های تماس', href: '/about' }], suggestions: [],
  };
  const cookingRequest = prefs.flavor || prefs.dish || /غذا|رسپی|دستور|آشپزی|بپز|پخت|ناهار|شام|خرید|بخر|نفر|مواد لازم/.test(input)
    || common.some(ingredient => input.includes(ingredient)) || /(?:^|\s)تن(?=$|[^\p{L}\p{N}])/u.test(input);
  const followUp = /این|همین|همون|خرید|مرحله|بپز|پخت|نفر|جایگزین|بدون/.test(input) && !/دیگر|دیگه|جدید/.test(input);
  if (!cookingRequest && !(previous && followUp)) return {
    mode: 'catalog', recipe: null,
    text: 'برای انتخاب غذا، مقدار مواد و مراحل پخت می‌تونم کمکت کنم. بگو چه موادی داری یا هوس چه غذایی کردی.',
    links: [], suggestions: ['با تن و سیب‌زمینی برای دو نفر چی بپزم؟', 'یک سالاد سریع پیشنهاد بده'],
  };
  const safe = catalogCandidates(catalog, prefs);
  const words = [...new Set((input.match(/\p{L}{3,}/gu) ?? []).filter(word =>
    !['برای', 'دارم', 'رسپی', 'بده', 'است', 'بدون', 'خواهم', 'میخوام'].includes(word)))];
  const ranked = safe.map(recipe => {
    const title = normalize(`${recipe.title} ${recipe.category} ${recipe.flavorLabel}`);
    const ingredients = normalize(recipe.ingredients.join(' '));
    const duration = Math.max(...(normalize(recipe.duration).match(/\d+/g) ?? []).map(Number), 0);
    const score = words.reduce((n, word) => n + (title.includes(word) ? 3 : ingredients.includes(word) ? 1 : 0), 0)
      + (prefs.quick && duration > 0 && duration <= 20 ? 5 : 0);
    return { recipe, score };
  }).sort((a, b) => b.score - a.score);
  const source = followUp && previous ? safe.find(r => r.slug === previous.sourceSlug) ?? ranked[0]?.recipe
    : /دیگر|دیگه|جدید/.test(input) ? ranked.find(r => r.recipe.slug !== previous?.sourceSlug)?.recipe : ranked[0]?.recipe;
  if (!source) return { mode: 'catalog', recipe: null, text: 'در مجموعهٔ فعلی، رسپی سازگار با محدودیت‌هایی که گفتی پیدا نکردم. مواد مجاز و زمانی که داری را بنویس تا انتخاب را دقیق‌تر کنیم.', links: [], suggestions: [] };
  const recipe = scaleRecipe(source, prefs.servings);
  const links = [
    { title: `دستور اصلی: ${source.title}`, href: `/recipes/${source.slug}` },
    { title: `آشنایی با تن ${source.flavorLabel}`, href: `/flavors/${source.flavor}` },
  ];
  const suggestions = [recipe.servings === 4 ? 'برای ۲ نفر تنظیمش کن' : 'برای ۴ نفر تنظیمش کن', 'لیست خرید این رسپی را بده', 'چطور نگهداریش کنم؟'];
  if (/خرید|بخر/.test(input)) return {
    mode: 'catalog', recipe, links, suggestions: ['قدم‌به‌قدم پخت این غذا را بگو', 'چطور نگهداریش کنم؟'],
    text: `این فهرست کامل مواد برای ${fa(recipe.servings)} نفر است؛ چیزهایی را که داری در کارت پایین تیک بزن. برای خرید تن، سالم‌بودن قوطی، تاریخ مصرف و ترکیبات روی برچسب را بررسی کن. قیمت یا موجودی فروشگاه‌ها در این دستیار در دسترس نیست.`,
  };
  if (/مرحله|قدم|بپز|پخت/.test(input) && previous) return {
    mode: 'catalog', recipe, links, suggestions,
    text: `از آماده‌سازی قوطی طبق برچسب شروع کن. مراحل دستور پایین کارت آمده و می‌توانی هر مرحلهٔ انجام‌شده را علامت بزنی. زمان ${recipe.duration} مربوط به دستور پایه است؛ زمان آماده‌سازی قوطی را جدا در نظر بگیر.`,
  };
  const restrictionNote = prefs.excluded.length ? ' مواد دستور با محدودیت‌های ثبت‌شده تطبیق داده شده‌اند؛ در صورت حساسیت، برچسب همهٔ مواد را هم بررسی کن.' : '';
  return {
    mode: 'catalog', recipe, links, suggestions,
    text: `از رسپی‌های ات‌مت، «${source.title}» را برایت انتخاب کردم و مقدار مواد را برای ${fa(recipe.servings)} نفر تنظیم کردم.${restrictionNote}${prefs.servings !== 2 ? '\nمقدار مواد به تناسب تعداد نفرات تغییر کرده؛ زمان و اندازهٔ ظرف ممکن است نیاز به تنظیم داشته باشد.' : ''}`,
  };
}
