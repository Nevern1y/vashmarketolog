"use client";

import BankLogosSlider from "@/components/BankLogosSlider";
import DealFeed from "@/components/deal-feed";
import FadeIn from "@/components/FadeIn";
import ManagerCTASection from "@/components/ManagerCTASection";
import SeeAlso from "@/components/see-also";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import WhyUs from "@/components/Why-us";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const bankOffers = [
  {
    id: 1,
    bank: "Альфа-Банк",
    transfers: "5 бесплатных",
    cashout: "от 1%",
    tariff: "0 ₽/мес",
    logo: "/logos/1.png",
  },
  {
    id: 2,
    bank: "Банк Точка",
    transfers: "10 бесплатных",
    cashout: "0,9%",
    tariff: "650 ₽/мес",
    logo: "/logos/2.svg",
  },
  {
    id: 3,
    bank: "ВТБ",
    transfers: "3 бесплатных",
    cashout: "0,8%",
    tariff: "490 ₽/мес",
    logo: "/logos/3.png",
  },
  {
    id: 4,
    bank: "МКБ",
    transfers: "8 бесплатных",
    cashout: "от 0,7%",
    tariff: "990 ₽/мес",
    logo: "/logos/4.png",
  },
  {
    id: 5,
    bank: "Сбер",
    transfers: "5 бесплатных",
    cashout: "1%",
    tariff: "0 ₽/мес",
    logo: "/logos/5.png",
  },
  {
    id: 6,
    bank: "Открытие",
    transfers: "15 бесплатных",
    cashout: "0,7%",
    tariff: "1200 ₽/мес",
    logo: "/logos/6.png",
  },
  {
    id: 7,
    bank: "Модульбанк",
    transfers: "7 бесплатных",
    cashout: "0,9%",
    tariff: "750 ₽/мес",
    logo: "/logos/7.png",
  },
  {
    id: 8,
    bank: "Райффайзенбанк",
    transfers: "5 бесплатных",
    cashout: "0,8%",
    tariff: "0 ₽/мес",
    logo: "/logos/8.png",
  },
  {
    id: 9,
    bank: "Россельхозбанк",
    transfers: "12 бесплатных",
    cashout: "1,2%",
    tariff: "600 ₽/мес",
    logo: "/logos/9.png",
  },
  {
    id: 10,
    bank: "Газпромбанк",
    transfers: "4 бесплатных",
    cashout: "1%",
    tariff: "0 ₽/мес",
    logo: "/logos/10.png",
  },
  {
    id: 11,
    bank: "Совкомбанк",
    transfers: "6 бесплатных",
    cashout: "0,75%",
    tariff: "950 ₽/мес",
    logo: "/logos/11.png",
  },
  {
    id: 12,
    bank: "Уралсиб",
    transfers: "9 бесплатных",
    cashout: "1,05%",
    tariff: "500 ₽/мес",
    logo: "/logos/12.png",
  },
];

const relatedServices = [
  {
    title: "Банковские гарантии",
    description:
      "44‑ФЗ, 223‑ФЗ, 185‑ФЗ (615 ПП), коммерческие закупки, налоговые гарантии.",
    cta: "Узнать лимит",
    href: "/bank-guarantee",
    image: "/globe.svg",
  },
  {
    title: "Льготное кредитование бизнеса",
    description:
      "Кредитование для осуществления текущих операционных и иных расходов.",
    cta: "Подобрать условия",
    href: "/credits",
    image: "/cart-and-box.png",
  },
  {
    title: "Финансирование контракта",
    description:
      "Онлайн заявка, сравнение ставок, выдача кредита на лучших условиях.",
    cta: "Подобрать кредит",
    href: "/tender-support",
    image: "/finance-products/money.png",
  },
  {
    title: "Лизинг",
    description: "Финансируем новое и с пробегом с авансом от 0%.",
    cta: "Узнать больше",
    href: "/leasing",
    image: "/finance-products/hands.png",
  },
  {
    title: "Тендерное сопровождение",
    description:
      "Каждый 3-й тендер — победа. Штат опытных специалистов и спецсчет.",
    cta: "Подробнее",
    href: "/tender-support",
    image: "/shield.png",
  },
  {
    title: "Проверка контрагентов",
    description:
      "Все от реквизитов и отчетности до контактов и кадровых рисков.",
    cta: "Подробнее",
    href: "/counterparty-check",
    image: "/window.svg",
  },
];

export default function Page() {
  const formSchema = z.object({
    inn: z
      .string()
      .min(1, "Введите ИНН")
      .regex(/^(\d{10}|\d{12})$/, "ИНН должен содержать 10 или 12 цифр"),
    amount: z
      .string()
      .min(1, "Введите сумму")
      .refine((val) => Number(val) > 0, "Сумма должна быть больше 0"),
    phone: z
      .string()
      .min(1, "Введите номер телефона")
      .regex(
        /^\+7[\s(]?\d{3}[\s)]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/,
        "Введите корректный номер телефона"
      ),
    consent: z
      .boolean()
      .refine(
        (val) => val === true,
        "Необходимо дать согласие на обработку персональных данных"
      ),
  });

  type FormData = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inn: "",
      amount: "",
      phone: "",
      consent: true,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время."
      );

      reset();
    } catch (error) {
      toast.error("Произошла ошибка при отправке заявки. Попробуйте еще раз.");
    }
  };

  const TOTAL_OFFERS = bankOffers.length;
  const [visibleOffers, setVisibleOffers] = useState(10);
  const banks = [
    "Реалист",
    "Банк Казани",
    "Абсолют",
    "МТС",
    "Зенит",
    "Альфа",
    "ПСБ",
    "Газпромбанк",
    "Уралсиб",
    "Металлинвестбанк",
    "Совкомбанк",
    "МКБ",
    "Банк Левобережный",
    "Руснарбанк",
    "СГБ",
    "МСП",
    "ТКБ",
    "Санкт-Петербург",
    "Тиньков",
    "Ингострахбанк",
    "СДМ Банк",
    "ЛокоБанк",
    "Ак Барс",
    "Алеф-Банк",
    "Евразийский Банк",
    "Росбанк",
    "Транстройбанк",
    "Урал ФД",
    "Банк Колуга",
    "Банк Солидарности",
    "Меткомбанк",
    "Солид Банк",
    "Промсоцбанк",
    "БСПБ",
    "Камкомбанк",
    "Озон Банк",
    "Дом РФ",
    "Кубань Кредит",
    "Газстрансбанк",
    "Сбербанк",
  ];
  const [visibleDeals] = useState(12);

  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");

  const filteredBanks = banks
    .map((bank, i) => ({
      name: bank,
      amount: 500_000_000,
      term: 2600,
    }))
    .filter(
      (bank) =>
        bank.name.toLowerCase().includes(search.toLowerCase()) &&
        (minAmount === "" || bank.amount >= minAmount) &&
        (maxAmount === "" || bank.amount <= maxAmount)
    )
    .slice(0, visibleOffers);

  const deals = Array.from({ length: 24 }).map((_, i) => ({
    title: [
      "Рко и спецсчета",
      "Рко и спецсчета",
      "Рко и спецсчета",
      "Рко и спецсчета",
    ][i % 4],
    amount: [
      "50 000 000 ₽",
      "26 205 355 ₽",
      "76 932 998 ₽",
      "37 955 980 ₽",
      "221 929 992 ₽",
      "30 000 000 ₽",
      "44 769 067 ₽",
    ][i % 7],
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-5xl">
                РКО и спецсчета
              </h1>

              <p className="max-w-2xl text-base text-foreground/80 md:text-lg">
                Предлагаем выбрать вам лучшие условия по расчётно-кассовому
                обслуживанию и открытию спецсчетов гарантии для бизнеса!
              </p>

              <ul className="mt-4 space-y-2 text-foreground/90 md:text-lg">
                <li className="list-disc marker:text-primary">
                  Обслуживание от 0 ₽/мес.
                </li>
                <li className="list-disc marker:text-primary">
                  Первый месяц бесплатно
                </li>
                <li className="list-disc marker:text-primary">
                  Реквизиты сразу онлайн
                </li>
              </ul>

              <div className="flex items-center gap-3">
                <Button asChild className="btn-three h-12">
                  <a href="#rko-form">Подать заявку</a>
                </Button>
              </div>
            </div>

            <div className="relative hidden h-[260px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl md:flex items-center justify-center">
              <Image
                src="/rko.jpeg"
                alt=""
                width={800}
                height={800}
                sizes="(min-width: 1024px) 520px, 380px"
                className="h-72 w-auto md:h-80 lg:h-88 object-contain"
                priority
              />
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <BankLogosSlider />
      </FadeIn>

      <FadeIn>
        <WhyUs variant="rko" />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-2xl font-semibold text-primary md:text-3xl">
              Подобрано 12 предложений
            </h3>
            <span className="text-xs text-foreground/60 sm:text-sm">
              Показываем только самые лучшие предложения
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {filteredBanks.slice(0, visibleOffers).map((bank, i) => (
              <div
                key={i}
                className="relative hover:border-primary/50 hover:shadow-primary/20 shadow-lg flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-foreground/10 bg-white/5 p-4 sm:p-5 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 text-lg sm:text-xl md:text-2xl font-semibold text-primary">
                    {bank.name}
                  </div>
                  <div className="text-xs text-foreground/70">
                    Переводы: 5 бесплатных · Снятие: от 1% · Стоимость тарифа:
                    650 ₽/месяц
                  </div>
                </div>
                <Button className="shrink-0 text-primary rounded-lg px-3 py-2 sm:rounded-xl sm:px-4 sm:py-2 text-xs font-semibold shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md bg-none border-2 border-primary hover:bg-primary hover:text-white cursor-pointer w-full sm:w-auto">
                  Подать заявку
                </Button>
              </div>
            ))}
          </div>

          {visibleOffers < TOTAL_OFFERS && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() =>
                  setVisibleOffers((v) => Math.min(v + 6, TOTAL_OFFERS))
                }
                className="h-12 btn-three"
              >
                Показать еще
              </Button>
            </div>
          )}
        </section>
      </FadeIn>
      <FadeIn>
        <section className="mx-auto mt-2 w-full max-w-7xl py-12">
          <div className="grid items-stretch gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Подберем самые выгодные предложения
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Заполните форму, выберите среди предложений банков лучшее,
                получите гарантию и заключайте контракт с заказчиком.
              </p>
              <form
                id="rko-form"
                className="space-y-4"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="grid gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="ИНН"
                      inputMode="numeric"
                      maxLength={12}
                      className={`h-12 w-full rounded-full border border-foreground/15 bg-background/90 px-4 text-sm text-foreground ${
                        errors.inn ? "border-red-500" : ""
                      }`}
                      {...register("inn")}
                    />
                    {errors.inn && (
                      <p className="text-red-500 text-xs mt-1 ml-4">
                        {errors.inn.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Input
                      type="number"
                      placeholder="Сумма"
                      inputMode="numeric"
                      min={1}
                      step={1000}
                      className={`h-12 w-full rounded-full border border-foreground/15 bg-background/90 px-4 text-sm text-foreground ${
                        errors.amount ? "border-red-500" : ""
                      }`}
                      {...register("amount")}
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1 ml-4">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          className={`h-12 w-full rounded-full border border-foreground/15 bg-background/90 px-4 text-sm text-foreground ${
                            errors.phone ? "border-red-500" : ""
                          }`}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1 ml-4">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <Controller
                  name="consent"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-start gap-3 text-xs text-foreground/70">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5 h-4 w-4 rounded border-foreground/30"
                      />
                      <span>
                        Ставя галочку, я соглашаюсь на обработку персональных
                        данных, в соответствии с
                        <a
                          href="/docs/agreement.pdf"
                          target="_blank"
                          className="mx-1 underline"
                        >
                          Соглашением
                        </a>
                        и
                        <a
                          href="/docs/privacy.pdf"
                          target="_blank"
                          className="ml-1 underline"
                        >
                          Политикой конфиденциальности
                        </a>
                        .
                      </span>
                    </label>
                  )}
                />
                {errors.consent && (
                  <p className="text-red-500 text-xs mt-1 ml-4">
                    {errors.consent.message}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 rounded-xl px-6 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-xl active:translate-y-0 bg-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Отправить заявку"}
                </Button>
              </form>
            </div>

            <div className="relative h-[320px] md:h-auto w-full rounded-3xl overflow-hidden border border-white/10">
              <Image
                src="/good-deal.jpg"
                alt="good deal"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </section>
      </FadeIn>
      <FadeIn>
        <SeeAlso currentPage="rko" />
      </FadeIn>

      <FadeIn>
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
                3 064 379 982 ₽
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
      </FadeIn>

      <FadeIn>
        <ManagerCTASection />
      </FadeIn>
      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-12">
          <h2 className="mb-10 text-2xl font-bold text-primary md:text-3xl">
            Часто ищут
          </h2>

          <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
              {[
                "открытие спецсчета",
                "банки для открытия спецсчетов",
                "открытие спецсчетов для торгов",
                "открытие спецсчета для участия",
                "расчетно кассовое обслуживание",
                "расчетно кассовое обслуживание банки",
                "кассовое обслуживание клиентов",
                "расчетно кассовое обслуживание клиентов",
                "рко",
                "рко для ип",
                "рко для юридических лиц",
                "тарифы рко",
                "рко для бизнеса",
                "рко для малого бизнеса",
                "специальные счета для бизнеса",
                "специальные счета для юридических лиц",
              ].map((t, i) => (
                <Link
                  key={i}
                  href="/v-razrabotke"
                  className="block nav-link link-gradient"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
