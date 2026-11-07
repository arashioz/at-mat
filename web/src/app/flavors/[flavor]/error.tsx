'use client';

export default function BrineError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="brine-loading">
      <p>صفحهٔ محصول الان باز نشد.</p>
      <button type="button" onClick={() => reset()}>دوباره</button>
    </main>
  );
}
