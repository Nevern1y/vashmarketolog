"use client";

import FadeIn from "@/components/FadeIn";
import ManagerCTASection from "@/components/ManagerCTASection";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import WhyUs from "@/components/Why-us";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import FaqSection from "@/components/FaqSection";
import SeeAlso from "@/components/see-also";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";
import type { SeoPageData } from "@/lib/seo-api";
import { normalizePopularSearches } from "@/lib/popular-searches";

const defaultPopularSearchTerms = [
  "депозиты для бизнеса",
  "депозиты для юридических лиц",
  "депозиты для ИП",
  "депозит для ООО",
  "открытие депозита",
  "депозитные ставки",
  "депозитные условия",
  "корпоративные депозиты",
  "депозиты с капитализацией",
  "депозит на короткий срок",
  "депозит на долгий срок",
  "надежные депозиты",
  "выгодные депозиты",
  "инвестиционные депозиты",
  "депозиты с пополнением",
  "депозиты с частичным снятием",
  "срочные депозиты",
  "депозиты для малого бизнеса",
  "депозитный счет",
  "депозиты под проценты",
];

interface DepositsPageProps {
  seoPage?: SeoPageData | null;
}

export default function DepositsPage({ seoPage }: DepositsPageProps) {
  const popularSearches = normalizePopularSearches(
    seoPage?.popular_searches,
    defaultPopularSearchTerms,
  );

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
      const result = await submitLead({
        full_name: "Клиент по депозиту",
        phone: data.phone,
        inn: data.inn,
        amount: Number(data.amount),
        product_type: "deposits",
        source: "website_form",
        form_name: "deposit_form",
      });

      if (!result.ok) {
        toast.error(result.error || "Произошла ошибка при отправке заявки.");
        return;
      }

      toast.success(
        "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
      );

      reset();
    } catch {
      toast.error("Произошла ошибка при отправке заявки. Попробуйте еще раз.");
    }
  };

  const [query, setQuery] = useState("");
  const [bankFilter, setBankFilter] = useState("all"); // <-- default "all"
  const [termFilter, setTermFilter] = useState("all"); // <-- default "all"
  const [visible, setVisible] = useState(9);

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

  const DEMO_OFFERS = banks.map((bank, i) => ({
    id: i + 1,
    bank,
    logo: `https://via.placeholder.com/160x48?text=${encodeURIComponent(bank)}`,
    amount: i % 2 === 0 ? "до 500 млн ₽" : "до 300 млн ₽",
    term: ["1 день", "от 30 до 365 дней", "от 60 до 360 дней"][i % 3],
    rate: ["28%", "24%", "18%", "12%"][i % 4],
    commission: ["до 23.5%", "От 22.49%", "до 4%"][i % 3],
    tags: i % 2 === 0 ? ["Пополнение", "Снятие"] : ["Без пополн."],
  }));

  const terms = ["1 день", "от 30 до 365 дней", "от 60 до 360 дней"];

  const filtered = DEMO_OFFERS.filter((o) => {
    if (bankFilter !== "all" && o.bank !== bankFilter) return false;
    if (termFilter !== "all" && o.term !== termFilter) return false;
    if (query && !o.bank.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  return (
    <main className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8 shadow-[0_0_30px_rgb(34,211,238,0.15)]">
          <div className="flex flex-col gap-6">
            <span className="inline-block font-bold text-4xl lg:text-5xl tracking-tight text-foreground">
              Депозиты для бизнеса в{" "}
              <span className="text-primary">Москве</span>
            </span>

            <p className="text-xl">
              Подайте заявки на открытие вклада для юридических лиц и ИП в
              несколько банков.
              <br />
              Выберите лучшие депозиты для малого и среднего бизнеса под высокий
              процент в 2026 году!
            </p>

            <div className="text-[var(--foreground-secondary)] text-sm mt-2">
              <ul className="space-y-1 text-[var(--foreground)] text-base">
                <li className="list-disc marker:text-primary">
                  Ставка до 16,7%
                </li>
                <li className="list-disc marker:text-primary">
                  Сумма от 1 до 1 000 000 000 ₽
                </li>
                <li className="list-disc marker:text-primary">
                  Срок от 8 до 365 дней
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <Link href="#application">
                <button className="h-12 btn-three font-semibold">
                  Подать заявку
                </button>
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ["Сумма", "до 1 млрд ₽"],
                ["Срок", "от 8 до 365 дней"],
                ["Ставка", "до 16,7%"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 min-w-[160px] flex flex-col gap-1"
                >
                  <div className="text-xs text-[var(--foreground-secondary)]">
                    {label}
                  </div>
                  <div className="font-semibold text-[var(--foreground)]">
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FadeIn>
          <div className="mt-10">
            <WhyUs variant="deposits" />
          </div>
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr,340px] gap-10">
          <section>
            <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl text-center">
              Предложения по депозитам
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-4 flex-wrap items-center">
                {/* Bank select (shadcn) */}
                <Select value={bankFilter} onValueChange={setBankFilter}>
                  <SelectTrigger className="min-w-[200px] rounded-xl bg-white/5 border border-white/10 text-[var(--foreground)]">
                    <SelectValue>
                      {bankFilter === "all" ? "Все банки" : bankFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все банки</SelectItem>
                    {banks.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Term select (shadcn) */}
                <Select value={termFilter} onValueChange={setTermFilter}>
                  <SelectTrigger className="min-w-[180px] rounded-xl bg-white/5 border border-white/10 text-[var(--foreground)]">
                    <SelectValue>
                      {termFilter === "all" ? "Все сроки" : termFilter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все сроки</SelectItem>
                    {terms.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по названию"
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm text-[var(--foreground)] min-w-[180px]"
                />
              </div>

              <div className="text-sm text-[var(--foreground-secondary)]">
                Найдено:{" "}
                <span className="text-white font-semibold">
                  {filtered.length}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.slice(0, visible).map((o) => (
                <article
                  key={o.id}
                  className="bg-white/5 hover:border-primary/50 hover:shadow-primary/10 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-primary font-semibold text-2xl">
                          {o.bank}
                        </div>
                        <div className="text-xs text-[var(--foreground-secondary)]">
                          {o.term}
                        </div>
                      </div>
                    </div>

                    <div
                      className="text-lg font-bold bg-gradient-to-r
                from-[var(--primary-light)] to-[var(--primary-dark)]
                bg-clip-text text-transparent drop-shadow-[0_0_10px_var(--primary-glow)]"
                    >
                      {o.rate}
                    </div>
                  </div>

                  <div className="mt-5 flex gap-3 flex-wrap">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 min-w-[120px]">
                      <div className="text-xs text-[var(--foreground-secondary)]">
                        Сумма
                      </div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {o.amount}
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 min-w-[120px]">
                      <div className="text-xs text-[var(--foreground-secondary)]">
                        Комиссия
                      </div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {o.commission}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 flex-wrap">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs text-[var(--foreground-secondary)] bg-white/5 border border-white/10 px-2 py-1 rounded-lg"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <Link href="#application">
                    <Button className="shrink-0 text-primary rounded-xl px-4 py-2 text-xs font-semibold shadow-sm  hover:-translate-y-0.5 hover:shadow-md bg-none border-2 border-primary hover:bg-primary hover:text-white hover:text-[oklch(0.141_0.005_285.823)] cursor-pointer mt-6 w-full transition-all">
                      Подать заявку
                    </Button>
                  </Link>
                </article>
              ))}
            </div>

            <div className="mt-6 text-center">
              {visible < filtered.length ? (
                <button
                  onClick={() => setVisible(filtered.length)}
                  className="h-12 btn-three"
                >
                  Показать еще
                </button>
              ) : (
                filtered.length > 9 && (
                  <button
                    onClick={() => setVisible(9)}
                    className="h-12 btn-three"
                  >
                    Свернуть
                  </button>
                )
              )}
            </div>
          </section>

          <FadeIn>
            <section
              className="mx-auto mt-2 w-full max-w-7xl py-12"
              id="application"
            >
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
                    id="deposit-application"
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
                            Ставя галочку, я соглашаюсь на обработку
                            персональных данных, в соответствии с
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

                <div className="relative h-80 md:h-auto w-full rounded-3xl overflow-hidden border border-white/10">
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
        </div>

        <FadeIn>
          <FaqSection
            title="Вопросы по депозитам"
            items={[
              {
                q: "Что такое депозит?",
                a: "Депозит — это вклад в банк под фиксированную или плавающую процентную ставку, который приносит доход через определённый срок.",
              },
              {
                q: "Какие бывают виды депозитов?",
                a: "Срочные депозиты, депозиты до востребования, накопительные счета, депозиты с возможностью пополнения и снятия, а также валютные депозиты.",
              },
              {
                q: "Чем отличается вклад от накопительного счёта?",
                a: "Вклад имеет фиксированный срок и ставку, а накопительный счёт позволяет свободно пополнять и снимать деньги, но с гибкой ставкой.",
              },
              {
                q: "Какой минимальный срок открывают депозиты?",
                a: "Обычно от 1 месяца до 36 месяцев, в зависимости от условий банка.",
              },
              {
                q: "Можно ли снимать деньги раньше срока?",
                a: "Да, но в большинстве случаев ставка пересчитывается на минимальную. Некоторые банки позволяют частичное снятие без потери процентов.",
              },
              {
                q: "Уплачиваются ли налоги с дохода по депозитам?",
                a: "Да, налог взимается с дохода, превышающего необлагаемый лимит. Банк удерживает налог автоматически.",
              },
              {
                q: "Насколько безопасны депозиты?",
                a: "Депозиты защищены системой страхования вкладов — до 1,4 млн рублей на одного человека в одном банке.",
              },
              {
                q: "Можно ли открыть депозит онлайн?",
                a: "Да, большинство банков позволяют открыть депозит полностью онлайн — через приложение или личный кабинет.",
              },
            ]}
          />
        </FadeIn>

        <FadeIn>
          <SeeAlso currentPage="deposit" />
        </FadeIn>

        <FadeIn>
          <ManagerCTASection />
        </FadeIn>

        <FadeIn>
          <section className="mx-auto w-full max-w-7xl py-12">
            <h2 className="mb-10 text-2xl font-bold text-primary md:text-3xl text-center">
              Часто ищут
            </h2>

            <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
                {popularSearches.map((item, i) => (
                  <div key={i}>
                    {item.href.startsWith("http://") ||
                    item.href.startsWith("https://") ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="nav-link link-gradient"
                      >
                        {item.text}
                      </a>
                    ) : (
                      <Link href={item.href} className="nav-link link-gradient">
                        {item.text}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>
      </div>
    </main>
  );
}
