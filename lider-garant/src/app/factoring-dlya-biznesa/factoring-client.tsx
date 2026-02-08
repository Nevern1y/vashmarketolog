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
import FaqSection from "@/components/FaqSection";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Page() {
  const TOTAL_OFFERS = 25;
  const [visibleOffers, setVisibleOffers] = useState(8);

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

  const [search, setSearch] = useState("");
  const [minAmount] = useState<number | "">("");
  const [maxAmount] = useState<number | "">("");

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
        "Введите корректный номер телефона",
      ),
    consent: z
      .boolean()
      .refine(
        (val) => val === true,
        "Необходимо дать согласие на обработку персональных данных",
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
        "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
      );

      reset();
    } catch (error) {
      toast.error("Произошла ошибка при отправке заявки. Попробуйте еще раз.");
    }
  };

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
        (maxAmount === "" || bank.amount <= maxAmount),
    )
    .slice(0, visibleOffers);

  const titles = [
    "факторинг для бизнеса",
    "факторинг для юридических лиц",
    "факторинг поставок",
    "закрытый факторинг",
    "кредитный факторинг",
    "факторинг без регресса",
    "факторинг с регрессом",
    "коммерческий факторинг",
    "факторинг для бизнеса",
    "факторинг для юридических лиц",
    "факторинг без регресса",
    "факторинг с регрессом",
  ];

  const amounts = [
    "50 000 000 ₽",
    "26 205 355 ₽",
    "76 932 998 ₽",
    "37 955 980 ₽",
    "221 929 992 ₽",
    "30 000 000 ₽",
    "44 769 067 ₽",
  ];

  const deals = Array.from({ length: 24 }).map((_, i) => ({
    title: titles[i % titles.length],
    amount: amounts[i % amounts.length],
  }));

  const faqs = [
    {
      q: "Кто оказывает услуги факторинга?",
      a: `
Финансовым агентом — фактором, который выдает деньги в рамках услуг факторинга, — может быть факторинговая компания, банк или микрофинансовая организация.

Часто бизнес обращается именно в банки, например, потому что у них открыт там расчетный счет. Нет смысла искать другое финансовое учреждение, если удобно обслуживаться в одном месте.

Покупатель затягивает сроки оплаты за поставку? Лидер-Гарант предлагает услуги факторинга для ИП и малого бизнеса на удобных условиях:

- Не нужен залог.
- Решение о финансировании — в этот же день. Заявку могут одобрить за 2 часа.
- Финансирование до 95% при факторинге с регрессом и до 100% — без регресса.
- Отсрочка до 120 календарных дней.

Лидер-Гарант помогает своим клиентам справляться с кассовыми разрывами и налаживать сотрудничество с контрагентами.
`,
    },
    {
      q: "Работают ли факторинговые компании с клиентами из других городов?",
      a: `
В большинстве случаев факторинговым компаниям неважно, за сколько километров от них находится клиент. Даже если компания в Москве, а клиент из Красноярска — это не влияет на скорость оказания услуг.

Современные технологии и гибкость факторинговых компаний позволяют работать с клиентами из любого региона:

- Удаленное взаимодействие: можно подать заявку, отправить документы и подписать договор онлайн.
- Электронный документооборот: все операции выполняются через системы электронного документооборота.
- Поддержка на расстоянии: персональные менеджеры всегда на связи через телефон, мессенджеры или видеозвонки.
- Отсутствие географических ограничений: важнее финансовое состояние компании и покупателей, а не местоположение.
`,
    },
    {
      q: "Кто может выступать инициатором факторинга?",
      a: `
Инициатором факторинга может быть как поставщик, так и покупатель, в зависимости от целей и потребностей бизнеса:

- Для поставщика: способ быстро получить деньги за проданные товары или услуги, не дожидаясь оплаты покупателем. При факторинге без регресса риск неоплаты переходит на факторинговую компанию.
- Для покупателя: инструмент для выстраивания долгосрочных отношений с поставщиком. Можно передавать всех поставщиков факторинговой компании и рассчитаться с фактором по мере появления денег.
`,
    },
  ];
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl space-y-1 leading-tight">
                ФАКТОРИНГ
              </h1>

              <div className="max-w-2xl text-base text-foreground/80 md:text-lg">
                <ul className="mt-2 space-y-2 list-inside">
                  <li className="list-disc marker:text-primary">
                    От 0,3% годовых.
                  </li>
                  <li className="list-disc marker:text-primary">от 1 дня</li>
                </ul>
              </div>
              <div className="flex items-center gap-3">
                <Button asChild className="h-12 btn-three">
                  <Link href="#factoring-form">Получить расчёт</Link>
                </Button>
              </div>
            </div>

            <div className="relative hidden h-[360px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl md:flex items-center justify-center">
              <Image
                src="/finance-products/calculator-hand.png"
                alt=""
                width={500}
                height={500}
                className="h-72 w-auto object-contain"
              />
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <BankLogosSlider />
      </FadeIn>

      <FadeIn>
        <WhyUs variant="factoring" />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-2xl font-semibold text-primary md:text-3xl">
              Подобрано 8 предложений
            </h3>
            <span className="text-xs text-foreground/60 sm:text-sm">
              Показываем только самые лучшие предложения
            </span>
          </div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              type="text"
              placeholder="Поиск по банку"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full md:w-1/3 rounded-full border border-foreground/15 px-4 text-sm"
            />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 backdrop-blur-xl shadow-[0_0_30px_-15px_rgba(0,0,0,0.25)]">
            <div className="grid gap-6 md:grid-cols-2">
              {filteredBanks.length > 0 ? (
                filteredBanks.slice(0, visibleOffers).map((bank, i) => (
                  <div
                    key={i}
                    className="relative flex flex-col sm:flex-row sm:items-center hover:border-primary/50 hover:shadow-primary/20 shadow-lg transition-all gap-3 sm:gap-4 rounded-xl border border-foreground/10 bg-white/5 p-4 sm:p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-lg sm:text-xl md:text-2xl font-semibold text-primary">
                        {bank.name}
                      </div>
                      <div className="text-xs text-foreground/70">
                        Сумма: до 500 млн ₽ · Срок: до 2600 дн · Комиссия: от
                        1.8%
                      </div>
                    </div>
                    <Link href="#factoring-form">
                      <Button className="shrink-0 text-primary rounded-lg px-3 py-2 sm:rounded-xl sm:px-4 sm:py-2 text-xs font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md bg-none border-2 border-primary hover:bg-primary hover:text-white hover:text-[oklch(0.141_0.005_285.823)] cursor-pointer w-full sm:w-auto">
                        Подать заявку
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-sm text-foreground/70 py-10">
                  По вашему запросу ничего не найдено.
                </div>
              )}
            </div>
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
        <section
          className="mx-auto mt-2 w-full max-w-7xl py-12"
          id="factoring-form"
        >
          <div className="grid items-stretch gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-primary">
                Подберем самые выгодные предложения
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Заполните форму, выберите среди предложений банков лучшее,
                получите гарантию и заключайте контракт с заказчиком.
              </p>
              <form
                id="factoring-application"
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
                  className="h-11 btn-three w-full"
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
                unoptimized
                priority
              />
            </div>
          </div>
        </section>
      </FadeIn>
      <FadeIn>
        <SeeAlso currentPage="factoring" />
      </FadeIn>

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

      <FadeIn>
        <FaqSection title="Вопросы по факторингу" items={faqs} />
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
                "факторинг для бизнеса",
                "факторинг для юридических лиц",
                "условия факторинга",
                "агентский факторинг",
                "виды факторингов",
                "факторинг отсрочка",
                "кредитный факторинг",
                "факторинг без регресса",
                "факторинг с регрессом",
                "факторинг кредитование",
                "банковский факторинг",
                "закрытый факторинг",
                "коммерческий факторинг",
                "стороны договора факторинга",
                "факторинг для малого бизнеса",
                "получение факторинга",
                "факторинг форма кредитования",
                "предоставления факторинга",
              ].map((t, i) => (
                <div key={i}>
                  <Link href="/v-razrabotke" className="nav-link link-gradient">
                    {t}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
