"use client";

export interface BestOffer {
  bank?: string;
  bank_name?: string;
  rating?: number;
  reviews?: number;
  rate?: string;
  custom_rate?: string;
  amount?: string;
  term?: string;
  custom_text?: string;
}

interface BestOffersSectionProps {
  title?: string;
  offers?: BestOffer[];
}

const defaultOffers: BestOffer[] = [
  {
    bank: "МСП Банк",
    rating: 5,
    reviews: 237,
    rate: "от 26%",
    amount: "до 50 млн",
    term: "до 60 мес",
  },
  {
    bank: "Т Банк",
    rating: 5,
    reviews: 93,
    rate: "от 2,49% в мес",
    amount: "до 60 млн",
    term: "до 60 мес",
  },
  {
    bank: "ВТБ",
    rating: 5,
    reviews: 71,
    rate: "от 22%",
    amount: "до 30 млн",
    term: "до 60 мес",
  },
  {
    bank: "Альфа Банк",
    rating: 5,
    reviews: 170,
    rate: "от 27,5%",
    amount: "до 50 млн",
    term: "до 60 мес",
  },
  {
    bank: "АТБ",
    rating: 5,
    reviews: 65,
    rate: "от 20,1%",
    amount: "до 50 млн",
    term: "до 60 мес",
  },
  {
    bank: "Дом.РФ Банк",
    rating: 5,
    reviews: 83,
    rate: "от 23,75%",
    amount: "до 100 млн",
    term: "до 60 мес",
  },
];

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="12"
    height="12"
    fill={filled ? "var(--primary)" : "none"}
    stroke="var(--primary)"
    strokeWidth="1.5"
  >
    <path d="M12 17.3l-5.4 3 1-6.1-4.4-4.3 6.1-.9L12 3l2.7 5.9 6.1.9-4.4 4.3 1 6.1z" />
  </svg>
);

export default function BestOffersSection({
  title = "Лучшие предложения",
  offers,
}: BestOffersSectionProps) {
  const normalizedOffers = (offers && offers.length > 0 ? offers : defaultOffers).map(
    (offer, idx) => ({
      bank: offer.bank || offer.bank_name || `Банк ${idx + 1}`,
      rating: Math.max(0, Math.min(5, offer.rating || 5)),
      reviews: offer.reviews || 0,
      rate: offer.custom_rate || offer.rate || "по запросу",
      amount: offer.amount || offer.custom_text || "условия по запросу",
      term: offer.term || "индивидуально",
    }),
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-5">
      <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] border border-foreground/10">
        <div className="relative px-5 sm:px-6 md:px-12 py-10 sm:py-12">
          <h2 className="mb-8 sm:mb-10 text-center text-[26px] xs:text-3xl md:text-[42px] font-semibold text-primary">
            {title}
          </h2>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            {normalizedOffers.map((o, i) => (
              <div
                key={`${o.bank}-${i}`}
                className="group hover:shadow-xl hover:shadow-primary/10 rounded-[22px] sm:rounded-[28px] border border-cyan-400/15 
                bg-white/[0.03] p-5 sm:p-6 shadow-sm 
                sm:shadow-[0_15px_45px_-25px_rgba(15,23,42,0.9)]
                transition-all duration-300 hover:border-cyan-300/40 
                hover:-translate-y-[2px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-xs sm:text-sm font-semibold text-foreground/90">
                      {o.bank[0]}
                    </div>
                    <div>
                      <div className="text-sm sm:text-lg font-semibold">{o.bank}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] sm:text-[11px] text-foreground/60">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} filled={idx < o.rating} />
                        ))}
                        <span>{o.reviews > 0 ? `${o.reviews} отзывов` : "условия индивидуально"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3 text-center text-[10px] sm:text-xs font-medium">
                  <div className="rounded-xl sm:rounded-2xl bg-white/8 px-2 sm:px-3 py-3 sm:py-4">
                    <div className="text-foreground/50">Ставка</div>
                    <div className="mt-1 text-[11px] sm:text-sm font-semibold text-foreground">
                      {o.rate}
                    </div>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl bg-white/8 px-2 sm:px-3 py-3 sm:py-4">
                    <div className="text-foreground/50">Сумма/условия</div>
                    <div className="mt-1 text-[11px] sm:text-sm font-semibold text-foreground">
                      {o.amount}
                    </div>
                  </div>

                  <div className="rounded-xl sm:rounded-2xl bg-white/8 px-2 sm:px-3 py-3 sm:py-4">
                    <div className="text-foreground/50">Срок</div>
                    <div className="mt-1 text-[11px] sm:text-sm font-semibold text-foreground">
                      {o.term}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
