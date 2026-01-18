"use client";

import Link from "next/link";

interface FrequentlySearchedProps {
  terms: string[];
}

export default function FrequentlySearched({ terms }: FrequentlySearchedProps) {
  return (
    <section className="mx-auto w-full max-w-7xl py-12">
      <h2 className="mb-10 text-2xl font-bold text-primary md:text-3xl">
        Часто ищут
      </h2>

      <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
          {terms.map((t, i) => (
            <Link
              key={i}
              href="/#application"
              className="block text-sm text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
            >
              {t}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
