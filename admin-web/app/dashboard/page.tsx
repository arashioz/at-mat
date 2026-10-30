'use client';

import Link from 'next/link';
import { AppShell } from '../../components/AppShell';

const CARDS = [
  { href: '/customers', title: 'مشتریان', desc: 'ثبت و مدیریت مشتریان (CRM)' },
  { href: '/products', title: 'محصولات', desc: 'کالاها، قیمت و موجودی (ERP)' },
];

export default function DashboardPage() {
  return (
    <AppShell title="داشبورد">
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-base font-bold text-brand-700">{card.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
