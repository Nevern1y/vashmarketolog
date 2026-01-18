"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BankOfferCard from "./BankOfferCard";
import { INPUT_CLASSES, BUTTON_CLASSES } from "@/constants";

interface BankOffer {
  name: string;
  amount: number;
  term: number;
  details?: string;
}

interface BankOffersSectionProps {
  title: string;
  subtitle: string;
  banks: BankOffer[];
  totalOffers: number;
  initialVisibleOffers?: number;
  getDetails?: (bank: BankOffer) => string;
  placeholder?: string;
}

export default function BankOffersSection({
  title,
  subtitle,
  banks,
  totalOffers,
  initialVisibleOffers = 6,
  getDetails,
  placeholder = "Поиск по банку",
}: BankOffersSectionProps) {
  const [visibleOffers, setVisibleOffers] = useState(initialVisibleOffers);
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");

  const filteredBanks = banks
    .filter(
      (bank) =>
        bank.name.toLowerCase().includes(search.toLowerCase()) &&
        (minAmount === "" || bank.amount >= minAmount) &&
        (maxAmount === "" || bank.amount <= maxAmount)
    )
    .slice(0, visibleOffers);

  const defaultGetDetails = (bank: BankOffer) => {
    return `Сумма: до ${bank.amount.toLocaleString("ru-RU")} ₽ · Срок: до ${
      bank.term
    } дн · Комиссия: от 1.8%`;
  };

  return (
    <section className="mx-auto w-full max-w-7xl py-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-2xl font-semibold text-primary md:text-3xl">
          {title}
        </h3>
        <span className="text-xs text-foreground/60 sm:text-sm">
          {subtitle}
        </span>
      </div>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full md:w-1/3 rounded-full border border-foreground/15 px-4 text-sm"
        />
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 backdrop-blur-xl shadow-[0_0_30px_-15px_rgba(0,0,0,0.25)]">
        <div className="grid gap-6 md:grid-cols-2">
          {filteredBanks.length > 0 ? (
            filteredBanks.map((bank, i) => (
              <BankOfferCard
                key={i}
                bankName={bank.name}
                details={
                  getDetails ? getDetails(bank) : defaultGetDetails(bank)
                }
              />
            ))
          ) : (
            <div className="col-span-full text-center text-sm text-foreground/70 py-10">
              По вашему запросу ничего не найдено.
            </div>
          )}
        </div>
      </div>

      {visibleOffers < totalOffers && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() =>
              setVisibleOffers((v) => Math.min(v + 6, totalOffers))
            }
            className={BUTTON_CLASSES.PRIMARY}
          >
            Показать еще
          </Button>
        </div>
      )}
    </section>
  );
}
