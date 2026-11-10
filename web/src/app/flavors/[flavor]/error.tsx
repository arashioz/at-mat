'use client';

export default function BrineError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="brine-loading">
      <p>صفحهٔ محصول بارگیری نشد.</p>
      <button type="button" onClick={() => reset()}>تلاش دوباره</button>
    </main>
  );
}
