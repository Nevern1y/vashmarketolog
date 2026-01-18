"use client";

import DealFeed from "./deal-feed";

interface Deal {
  title: string;
  amount: string;
}

interface DealFeedSectionProps {
  deals: Deal[];
  totalAmount?: string;
}

export default function DealFeedSection({
  deals,
  totalAmount = "3 064 379 982 ₽",
}: DealFeedSectionProps) {
  return (
    <section className="mx-auto mt-2 w-full max-w-7xl py-8">
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Лента сделок
          </h2>
          <p className="text-sm text-foreground/60">
            Последние заявки от наших клиентов и агентов
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground md:text-3xl">
            {totalAmount}
          </div>
          <div className="text-xs text-foreground/60">
            Общая сумма последних заявок
          </div>
        </div>
      </div>
      <div className="">
        <DealFeed deals={deals} />
      </div>
    </section>
  );
}
