'use client';

import Link from 'next/link';

export default function RecipesError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="brine-loading"><h1>رسپی‌ها فعلاً در دسترس نیستند.</h1><button type="button" onClick={reset}>تلاش دوباره</button><Link href="/">بازگشت به ات‌مت</Link></main>;
}
