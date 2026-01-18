"use client";

import { Button } from "@/components/ui/button";

interface BankOfferCardProps {
  bankName: string;
  details: string;
  onSubmit?: () => void;
}

export default function BankOfferCard({
  bankName,
  details,
  onSubmit,
}: BankOfferCardProps) {
  return (
    <div className="relative flex flex-col sm:flex-row sm:items-center hover:border-primary/50 hover:shadow-primary/20 shadow-lg transition-all gap-3 sm:gap-4 rounded-xl border border-foreground/10 bg-white/5 p-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-lg sm:text-xl md:text-2xl font-semibold text-primary">
          {bankName}
        </div>
        <div className="text-xs text-foreground/70">{details}</div>
      </div>
      <Button
        className="shrink-0 text-primary rounded-lg px-3 py-2 sm:rounded-xl sm:px-4 sm:py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md bg-none border-2 border-primary hover:bg-primary hover:text-white cursor-pointer w-full sm:w-auto"
        onClick={onSubmit}
      >
        Подать заявку
      </Button>
    </div>
  );
}
