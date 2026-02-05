"use client";
import FadeIn from "@/components/FadeIn";
import BankLogosSlider from "@/components/BankLogosSlider";
import ManagerCTASection from "@/components/ManagerCTASection";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import Link from "next/link";
import WhyUs from "@/components/Why-us";
import FaqSection from "@/components/FaqSection";
import DealFeed from "@/components/deal-feed";
import SeeAlso from "@/components/see-also";
import { Clock, Coins, Gift, HandCoins, Truck } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { toast } from "sonner";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";

export default function Page() {
  const TOTAL_OFFERS = 17;
  const [visibleOffers, setVisibleOffers] = useState(6);

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
  const [minAmount, setMinAmount] = useState<number | "">("");
  const [maxAmount, setMaxAmount] = useState<number | "">("");

  const [phoneKey, setPhoneKey] = useState(0);

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
        /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/,
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
      setPhoneKey((k) => k + 1);
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

  const deals = Array.from({ length: 24 }).map((_, i) => ({
    title: [
      "Лизинг для бизнеса",
      "Лизинг для малого бизнеса",
      "Лизинг оборудование для бизнеса",
      "Лизинг оборудования для малого бизнеса",
      "Льготный лизинг для бизнеса",
      "Льготный лизинг для малого бизнеса",
      "Лизинг для ип",
      "Лизинг авто для ип",
      "Лизинг для ип без первоначального взноса",
      "Лизинг машин оборудования",
      "Лизинг оборудования",
      "Лизинг авто для юридических лиц",
      "Лизинг бу авто",
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

  const faqs = [
    {
      q: "Что такое предмет лизинга?",
      a: "Это могут быть любые непотребляемые вещи, в том числе предприятия и другие имущественные комплексы, здания, сооружения, оборудование, транспортные средства и другое движимое и недвижимое имущество, кроме земельных участков и других природных объектов.",
    },
    {
      q: "Кто участвует в лизинговой сделке?",
      a: "Субъектами лизинговой сделки являются лизингодатель, лизингополучатель и продавец. При возвратном лизинге продавец и лизингополучатель — одно лицо.",
    },
    {
      q: "Какие обязательства несёт лизингополучатель?",
      a: "Важно соблюдать условия договора: вносить лизинговые платежи в установленные графиком сроки, использовать предмет лизинга и содержать его в соответствии с условиями договора, давать лизингодателю полную информацию о состоянии арендуемой техники и предоставлять доступ для проверки.",
    },
    {
      q: "Что можно и нельзя делать с автомобилями, которые взяли в лизинг?",
      a: "После заключения договора лизингополучатель обретает права владения и пользования автомобилем, но в собственность он перейдёт только после выкупа. Лизингополучатель должен самостоятельно проходить ТО и обслуживать автомобиль, оплачивать штрафы, если нарушит правила дорожного движения, соблюдать лимиты пробега, если они оговорены в договоре.",
    },
    {
      q: "Как вносятся платежи по лизингу?",
      a: "Оплата производится по графику, который прописывается в договоре и доступен в личном кабинете клиента. Важно вносить платежи своевременно, так как просрочки ведут к начислению пеней и возможному расторжению контракта.",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-center gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                Лизинг для юридических лиц
              </h1>
              <h2 className="text-2xl font-semibold">
                Предложим самые выгодные предложения по лизингу для бизнеса:
              </h2>
              <p className="max-w-2xl text-base text-foreground/80 md:text-lg"></p>
              <ul>
                <li className="list-disc marker:text-primary">
                  Финансируем с авансом от 0%
                </li>
                <li className="list-disc marker:text-primary">
                  Работаем со сложным оборудованием.
                </li>
                <li className="list-disc marker:text-primary">
                  Подберем выгодное решение для вашей компании.
                </li>
              </ul>
              <Button asChild className="btn-three h-12">
                <a href="#leasing-form">Подать заявку</a>
              </Button>
            </div>

            <div className="relative hidden md:block aspect-[4/3] w-full overflow-hidden rounded-2xl">
              <Image
                src="/leasing.jpg"
                alt="Лизинг для бизнеса"
                fill
                className="object-cover object-center"
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
        <WhyUs variant="leasing" />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-2 w-full max-w-7xl py-10">
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-primary  text-center">
            Получите персональное предложение
          </h2>

          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              {
                text: "Аванс от 0%",
                icon: <Coins size={32} className="text-white" />,
              },
              {
                text: "Экспресс рассмотрение",
                icon: <Clock size={32} className="text-white" />,
              },
              {
                text: "Экономия на налогах",
                icon: <HandCoins size={32} className="text-white" />,
              },
              {
                text: "Работаем с Б/У",
                icon: <Truck size={32} className="text-white" />,
              },
              {
                text: "Спецпредложения и скидки",
                icon: <Gift size={32} className="text-white" />,
              },
            ].map(({ text, icon }) => (
              <div
                key={text}
                className="flex w-[150px] flex-col items-center gap-2 rounded-xl border border-primary/10 px-4 py-4 text-center text-sm text-foreground/85 backdrop-blur-md transition hover:border-primary/60"
              >
                <div className="p-3 rounded-lg bg-primary ">{icon}</div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative mx-auto mt-6 md:mt-8 w-full max-w-7xl bg-white/5 overflow-visible rounded-2xl md:rounded-3xl px-4 md:px-6 lg:px-12 py-6 md:py-10 border border-foreground/10">
          <div className="relative z-10 flex flex-col lg:flex-row items-start gap-8 h-full">
            <div className="hidden md:block shrink-0 relative w-1/2 min-h-[450px] mt-15 rounded-3xl overflow-hidden border border-foreground/10">
              <Image
                src="/good-deal.jpg"
                alt="Good Deal"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>

            <div className="flex-1 w-full lg:w-auto">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full max-w-lg rounded-2xl md:rounded-3xl border border-foreground/20 bg-white/5 p-6 md:p-10 shadow-2xl relative"
                aria-label="Форма лизинга"
                id="leasing-form"
              >
                <h3 className="mb-2 text-xl md:text-2xl font-bold text-primary">
                  Подберем самые выгодные предложения
                </h3>
                <p className="mb-4 text-xs md:text-sm text-foreground/70">
                  Заполните форму, выберите среди предложений лучшее, получите
                  финансирование и заключайте контракт.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inn" className="text-xs md:text-sm">
                      ИНН
                    </Label>
                    <Input
                      id="inn"
                      type="text"
                      placeholder="ИНН"
                      inputMode="numeric"
                      className={`bg-white border-gray-300 text-black px-4 py-2.5 text-sm md:text-base rounded-md ${
                        errors.inn ? "border-red-500" : ""
                      }`}
                      {...register("inn")}
                    />
                    {errors.inn && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.inn.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-xs md:text-sm">
                      Сумма
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Сумма"
                      min={1}
                      step={1000}
                      className={`bg-white border-gray-300 text-black px-4 py-2.5 text-sm md:text-base rounded-md ${
                        errors.amount ? "border-red-500" : ""
                      }`}
                      {...register("amount")}
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs md:text-sm">
                      Телефон
                    </Label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          key={phoneKey}
                          id="phone"
                          className={`bg-white border-gray-300 text-black px-4 py-2.5 text-sm md:text-base rounded-md ${
                            errors.phone ? "border-red-500" : ""
                          }`}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <Controller
                      name="consent"
                      control={control}
                      render={({ field }) => (
                        <Label className="flex items-start gap-2 cursor-pointer">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-5 w-5 rounded border border-gray-300 accent-primary focus:ring-2 focus:ring-primary/30 mt-0.5"
                          />
                          <span className="text-xs md:text-sm ml-2">
                            Я соглашаюсь на обработку{" "}
                            <span className="font-medium text-primary">
                              персональных данных
                            </span>{" "}
                            в соответствии с
                            <a
                              href="/docs/agreement.pdf"
                              target="_blank"
                              className="underline mx-1"
                            >
                              Соглашением
                            </a>{" "}
                            и
                            <a
                              href="/docs/privacy.pdf"
                              target="_blank"
                              className="underline ml-1"
                            >
                              Политикой конфиденциальности
                            </a>
                            .
                          </span>
                        </Label>
                      )}
                    />
                    {errors.consent && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.consent.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="mt-4 btn-three h-12 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Отправка..." : "Отправить заявку"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-2xl font-semibold text-primary md:text-3xl lg:text-4xl">
              Подобрано 17 предложений
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
              className="h-10 w-full md:w-1/3 text-foreground rounded-full border border-foreground/15 px-4 text-sm"
            />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 backdrop-blur-xl shadow-[0_0_30px_-15px_rgba(0,0,0,0.25)]">
            <div className="grid gap-6 md:grid-cols-2">
              {filteredBanks.length > 0 ? (
                filteredBanks.slice(0, visibleOffers).map((bank, i) => (
                  <div
                    key={i}
                    className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-foreground/10 bg-white/5 p-4 sm:p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-lg sm:text-xl md:text-2xl font-semibold text-primary">
                        {bank.name}
                      </div>
                      <div className="text-xs text-foreground/70">
                        Сумма лизинга: до 80 млн ₽ · Срок: до 2600 дн ·
                        Удорожание в год: от 16,4%
                      </div>
                    </div>
                    <Link href="#leasing-form">
                      <Button className="shrink-0 text-primary rounded-lg px-3 py-2 sm:rounded-xl sm:px-4 sm:py-2 text-xs font-semibold shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md bg-none border-2 border-primary hover:bg-primary hover:text-white hover:text-[oklch(0.141_0.005_285.823)] cursor-pointer w-full sm:w-auto">
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
        <SeeAlso currentPage="leasing" />
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
        <FaqSection
          title="Вопросы по лизингу для юридических лиц"
          items={faqs}
        />
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
                "лизинг для бизнеса",
                "лизинг для малого бизнеса",
                "лизинг оборудование для бизнеса",
                "лизинг оборудования для малого бизнеса",
                "льготный лизинг для бизнеса",
                "льготный лизинг для малого бизнеса",
                "лизинг для ип",
                "лизинг авто для ип",
                "лизинг для ип без",
                "лизинг для ип без первоначального",
                "лизинг для ип без первоначального взноса",
                "лизинг авто для ип без первоначального взноса",
                "лизинг для ип на авто без первоначального",
                "условия лизинга для ип",
                "газель в лизинг для ип",
                "автомобиль в лизинг для ип",
                "машина в лизинг для ип",
                "лизинг для ип калькулятор",
                "грузовой лизинг для ип",
                "лизинг для ип на усн",
                "купить в лизинг для ип",
                "лизинг авто с пробегом",
                "лизинг бу авто",
                "лизинг авто для юридических",
                "лизинг авто для юридических лиц",
                "лизинг оборудования",
                "оборудование лизинг аренда",
                "договор лизинга оборудования",
                "финансовый лизинг оборудования",
                "стоимость лизинга оборудования",
                "оборудование кредит лизинг",
                "лизинг машин оборудования",
                "лизинг оборудования компания",
                "приобрести оборудование в лизинг",
                "какое оборудование в лизинг",
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
