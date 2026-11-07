'use client';
import Link from 'next/link';
export default function ArticlesError({ reset }: { reset: () => void }) {
  return <main id="main-content" className="brine-loading"><h1>مجله فعلاً در دسترس نیست.</h1><p>یک بار دیگر امتحان کن.</p><button type="button" onClick={reset}>دوباره تلاش کن</button><Link href="/recipes">رفتن به رسپی‌ها</Link></main>;
}
