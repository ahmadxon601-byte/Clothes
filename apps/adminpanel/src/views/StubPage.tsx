'use client';

import { AppCard } from '../components/ui/AppCard';

interface StubPageProps {
  title: string;
  description: string;
}

export default function StubPage({ title, description }: StubPageProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-main tracking-tight">{title}</h2>
        <p className="text-sm md:text-base text-muted font-medium mt-2">{description}</p>
      </div>

      <AppCard className="p-8 md:p-10">
        <div className="rounded-2xl border border-border bg-pill/40 p-6 md:p-8">
          <p className="text-main font-semibold text-lg">Sahifa tayyor holatda ochiladi.</p>
          <p className="text-muted text-sm mt-2">
            Bu bo'lim uchun funksional keyingi bosqichda bosqichma-bosqich qo'shiladi.
          </p>
        </div>
      </AppCard>
    </div>
  );
}
