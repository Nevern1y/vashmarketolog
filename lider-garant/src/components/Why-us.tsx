import { Laptop, Layers, Percent, Timer, UserCheck } from "lucide-react";

export interface BenefitItem {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface WhyUsProps {
  variant:
    | "credits"
    | "leasing"
    | "factoring"
    | "insurance"
    | "deposits"
    | "ved"
    | "rko"
    | "guarantee"
    | "vacancies";
}

export default function WhyUs({ variant }: WhyUsProps) {
  const firstWordMap: Record<WhyUsProps["variant"], string> = {
    credits: "кредита для бизнеса",
    guarantee: "банковской гарантии",
    leasing: "лизинга для юридических лиц",
    factoring: "факторинга для бизнеса",
    insurance: "страхования СМР",
    deposits: "депозиты",
    ved: "ВЭД и международные платежи",
    rko: "РКО и спецсчета",
    vacancies: "работы в нашей компании",
  };

  const specialWord = firstWordMap[variant];

  const benefits: BenefitItem[] = [
    {
      text: `Все операции онлайн — от оформления до получения ${specialWord}.`,
      icon: Laptop,
    },
    { text: "Возможность выбрать самое подходящее предложение.", icon: Layers },
    { text: "Помощь менеджера в оформлении заявки.", icon: UserCheck },
    {
      text: "Рассмотрение заявки ≤ 1 часа, гарантия в день обращения.",
      icon: Timer,
    },
    { text: "Минимальная комиссия банка.", icon: Percent },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl py-5">
      <h2 className="mb-12 text-center text-4xl font-bold text-primary ">
        Почему выбирают нас для {specialWord}?
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {benefits.map((item, i) => (
          <div
            key={i}
            className="group relative hover:shadow-xl hover:shadow-primary/10 flex flex-col items-center text-center gap-3 rounded-2xl border border-primary/10 bg-background/70 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:border-primary/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md group-hover:scale-110 transition-transform">
              <item.icon className="h-6 w-6" />
            </div>

            <p className="text-foreground/80 text-xs md:text-sm leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
