"use client";
import FadeIn from "@/components/FadeIn";
import BankLogosSlider from "@/components/BankLogosSlider";
import ManagerCTASection from "@/components/ManagerCTASection";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import "swiper/css";
import Link from "next/link";
import WhyUs from "@/components/Why-us";
import DealFeed from "@/components/deal-feed";
import SeeAlso from "@/components/see-also";
import { CheckCheck } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import FaqSection from "@/components/FaqSection";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Page() {
  const TOTAL_OFFERS = 25;
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
  const [minAmount] = useState<number | "">("");
  const [maxAmount] = useState<number | "">("");
  const [showAll, setShowAll] = useState(false);

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
    fullname: z
      .string()
      .min(2, "ФИО должно содержать минимум 2 символа")
      .regex(/^[а-яА-ЯёЁ\s]+$/, "ФИО должно содержать только русские буквы"),
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
      fullname: "",
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

  const deals = Array.from({ length: 14 }).map((_, i) => ({
    title: [
      "кредит для бизнеса",
      "кредитная линия",
      "оборотный кредит",
      "кредит на развития",
      "кредиты мал бизнесу",
      "кредит среднему бизнесу",
      "кредит для ип",
      "кредит для ооо",
      "кредит для юридических лиц",
      "кредит на оборотные средства",
      "кредит на пополнение оборотных средств",
      "кредит для бизнеса без залога",
      "кредит под залог коммерческой недвижимости",
      "кредит на проект",
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
      q: "Как повысить шансы на получение кредита для бизнеса?",
      a: `
- Проверьте кредитную историю  
- Подготовьте залог  
- Заплатите налоги и штрафы  
- Привлеките и выплатите небольшой кредит  
- Узнайте кредитный потенциал своего бизнеса  
- Объедините несколько действующих кредитов в один  
- Рассчитайте нагрузку
    `,
    },
    {
      q: "Какой процент под кредит для бизнеса?",
      a: "от 4,5%",
    },
    {
      q: "Как взять кредит для бизнеса?",
      a: "Обратиться в ЛИДЕР-ГАРАНТ",
    },
    {
      q: "Где взять кредит для бизнеса?",
      a: "Обратиться в ЛИДЕР-ГАРАНТ",
    },
    {
      q: "Можно ли взять кредит под контракт?",
      a: "Да, возможно. До 70% от суммы контракта. Оставьте заявку на кредит под контракт и получите лучшие условия!",
    },
    {
      q: "Какие виды кредитов для бизнеса можно получить онлайн?",
      a: `
- Экспресс-кредит  
- Кредит бизнесу на пополнение оборотов компании (ООО и ИП)  
- Кредит на исполнение контракта  
- Возобновляемая кредитная линия (ВКЛ)  
- Невозобновляемая кредитная линия (НКЛ)  
- Кредит под проект  
- Бизнес
    `,
    },
    {
      q: "Какие виды кредитных линий можно получить бизнесу?",
      a: `
- ВКЛ: возобновляемая кредитная линия  
- НКЛ: невозобновляемая кредитная линия
    `,
    },
    {
      q: "Какие виды оборотных кредитов?",
      a: "Это вид кредита для бизнеса для компаний со стабильным оборотом в последние года.",
    },
    {
      q: "Что значит оборотный кредит?",
      a: "Это кредит для бизнеса под пополнение оборотов для увеличения прибыли компании.",
    },
    {
      q: "Кому дают льготный кредит?",
      a: "Оборотный кредит дают ООО и ИП с оборотом.",
    },
    {
      q: "Как повысить шансы на одобрение заявки?",
      a: "Взять кредит на небольшую сумму и погасить.",
    },
    {
      q: "Что может быть залогом при кредитовании?",
      a: "Частная и коммерческая недвижимость, автомобили.",
    },
    {
      q: "Кто может выступать поручителем?",
      a: "Учредитель или третье лицо.",
    },
    {
      q: "Берете ли вы в залог имущество 3-х лиц?",
      a: "Да, возможно, если они готовы быть поручителями.",
    },
    {
      q: "На какой срок можно получить сейчас кредит?",
      a: "До 10 лет.",
    },
    {
      q: "Сколько времени занимает оформление кредита?",
      a: "От 1 до 5 дней в зависимости от суммы и вида кредита.",
    },
    {
      q: "Как оформить кредит на открытие франшизы?",
      a: [
        "Сумма кредита покрывает максимум 80% стоимости франшизы. Это своеобразная гарантия кредитной организации.",
        "Первоначальный взнос — ориентировочно 20% от суммы займа",
      ],
    },
    {
      q: "Как оформить кредит на стартап?",
      a: [
        "Оформить кредит для стартапов можно без поручителей и залога.",
        "Сумма: до 50 млн",
        "Срок: до 3 лет",
        "Процентная ставка индивидуально",
        "Срок регистрации компании от 6 месяцев",
        "Обороты подтверждает выписка из банка или по счёту",
      ],
    },
    {
      q: "Как оформить кредит на открытие стоматологии?",
      a: [
        "Возьмите кредит на открытие стоматологии за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие стоматологии",
      ],
    },
    {
      q: "Как оформить кредит на открытие магазина?",
      a: [
        "Возьмите кредит на открытие магазина за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие магазина",
      ],
    },
    {
      q: "Как оформить кредит на открытие производства?",
      a: [
        "Возьмите кредит на открытие производства за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие производства",
      ],
    },
    {
      q: "Как оформить кредит на открытие пвз озон?",
      a: [
        "Возьмите кредит на открытие пвз озон за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие пвз озон",
      ],
    },
    {
      q: "Как оформить кредит на открытие wildberries?",
      a: [
        "Возьмите кредит на открытие wildberries за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие wildberries",
      ],
    },
    {
      q: "Как оформить кредит на открытие парикмахерской?",
      a: [
        "Возьмите кредит на открытие парикмахерской за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие парикмахерской",
      ],
    },
    {
      q: "Как оформить кредит на открытие салона красоты?",
      a: [
        "Возьмите кредит на открытие салона красоты за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие салона красоты",
      ],
    },
    {
      q: "Как оформить кредит на открытие пекарни?",
      a: [
        "Возьмите кредит на открытие пекарни за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие пекарни",
      ],
    },
    {
      q: "Как оформить кредит на открытие кофейни?",
      a: [
        "Возьмите кредит на открытие кофейни за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие кофейни",
      ],
    },
    {
      q: "Как оформить кредит на открытие кафе?",
      a: [
        "Возьмите кредит на открытие кафе за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие кафе",
      ],
    },
    {
      q: "Как оформить кредит на открытие ресторана?",
      a: [
        "Возьмите кредит на открытие ресторана за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на открытие ресторана",
      ],
    },
    {
      q: "Как получить кредит на пополнение оборотных средств?",
      a: [
        "Возьмите кредит на оборотные средства за считанные минуты и с минимальным пакетом документов.",
        "Сумма: до 50 млн",
        "Срок: до 5 лет",
        "Отправить заявку на кредит на пополнение оборотных средств",
      ],
    },
    {
      q: "Как получить кредит для ИП с плохой кредитной историей?",
      a: [
        "Чтобы получить кредит для ИП с плохой кредитной историей нужно:",
        "Привлечь поручителя",
        "Предоставить залоговое обеспечение",
        "Взять кредит с первоначальным взносом",
        "Или исправить кредитную историю: оформить кредитную карту, пользоваться ею, взять деньги в МФО под высокий процент, купить мебель или технику в рассрочку и вовремя выплатить",
      ],
    },
  ];

  const visibleFaqs = showAll ? faqs : faqs.slice(0, 7);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-start gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-primary">
                Кредиты для бизнеса
              </h1>
              <p className="max-w-2xl text-foreground/70">
                Предлагаем выбрать вам лучшие условия по кредиту для бизнеса!
              </p>
              <ul>
                <li className="list-disc marker:text-primary">
                  Персональные условия кредитования
                </li>
                <li className="list-disc marker:text-primary">
                  Быстрое одобрение
                </li>
                <li className="list-disc marker:text-primary">
                  Сумма и срок под ваши задачи
                </li>
              </ul>
              <Button asChild className="h-12 btn-three">
                <Link href="#application">Подать заявку</Link>
              </Button>
            </div>

            <div className="relative hidden h-[360px] w-full overflow-hidden rounded-3xl md:flex items-center justify-center">
              <div className="absolute bottom-2 right-5 space-y-3 z-20">
                <div className="flex items-center gap-3 rounded-lg bg-background/60 border border-white/10 px-3 py-2 backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCheck className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Одна заявка — множество предложений
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-background/60 border border-white/10 px-3 py-2 backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCheck className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Одобрение и выдача кредита онлайн
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-background/60 border border-white/10 px-3 py-2 backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCheck className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Все виды банковских гарантий
                  </span>
                </div>
              </div>

              <Image
                src="/credit-bg.jpeg"
                alt=""
                width={640}
                height={640}
                sizes="(min-width: 1024px) 520px, 380px"
                className="h-72 w-auto md:h-80 lg:h-88 object-contain rounded-2xl"
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
        <WhyUs variant="credits" />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-8 w-full max-w-7xl py-10">
          <h2 className="mb-8 text-4xl text-center font-bold tracking-tight text-primary">
            Виды кредита для бизнеса
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Кредитная линия (ВКЛ / НКЛ)",
              "Оборотный кредит (до 2 млрд)",
              "На исполнение контракта (до 2 млрд)",
              "Инвестиционные цели",
              "На любые цели",
              "Бизнес-ипотека",
            ].map((t, i) => (
              <div
                key={i}
                className="relative overflow-hidden hover:border-primary/50 hover:shadow-primary/10 rounded-3xl border border-white/20 bg-white/5 p-6 text-sm text-foreground/90 backdrop-blur-md shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl"
              >
                <h3 className="mb-2 text-base font-semibold text-primary">
                  {t}
                </h3>
                <p className="text-sm text-foreground/70">
                  Подробное описание условий и преимуществ данного вида кредита.
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>
      <FadeIn>
        <section className="mx-auto mt-6 w-full max-w-7xl py-12">
          <h2 className="mb-8 text-4xl font-bold tracking-tight text-primary text-center">
            Выгоднее и проще, чем напрямую в банк
          </h2>
          <div className="grid gap-6 grid-cols-1">
            {[
              "Предложение по кредиту (одобрение согласно публикации протокола)",
              "Минимум документооборота (нужны только скан-копии и КП)",
              "Лучшие предложения (Среди нескольких банков и маркетплейсов)",
              "Надёжно и быстро (Согласование до получения решения – до 8 часов)",
            ].map((t, i) => (
              <div
                key={i}
                className="group relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md hover:shadow-primary/10 shadow-xl transition-all duration-300 hover:border-primary"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white text-sm font-bold shadow-md">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {t}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section
          className="mx-auto mt-2 w-full max-w-7xl py-12"
          id="application"
        >
          <div className="grid items-stretch gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-primary">
                Подберем самые выгодные предложения
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Заполните форму, выберите среди предложений банков лучшее,
                получите кредит и заключайте контракт.
              </p>
              <form
                className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-[0_0_30px_-15px_rgba(0,0,0,0.25)]"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="grid gap-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="ИНН"
                      inputMode="numeric"
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

                  <div>
                    <Input
                      placeholder="ФИО"
                      className={`h-12 w-full rounded-full border border-foreground/15 bg-background/90 px-4 text-sm text-foreground ${
                        errors.fullname ? "border-red-500" : ""
                      }`}
                      {...register("fullname", {
                        onChange: (e) => {
                          const value = e.target.value.replace(/[0-9]/g, "");
                          e.target.value = value;
                        },
                      })}
                    />
                    {errors.fullname && (
                      <p className="text-red-500 text-xs mt-1 ml-4">
                        {errors.fullname.message}
                      </p>
                    )}
                  </div>
                </div>

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
                        Я даю согласие на обработку{" "}
                        <span className="font-medium text-primary">
                          персональных данных
                        </span>
                      </span>
                    </Label>
                  )}
                />
                {errors.consent && (
                  <p className="text-red-500 text-xs mt-1 ml-4">
                    {errors.consent.message}
                  </p>
                )}

                <Button
                  type="submit"
                  className="h-11 font-semibold btn-three w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Отправить заявку"}
                </Button>
              </form>
            </div>
            <div className="relative hidden min-h-[280px] overflow-hidden rounded-3xl border border-foreground/10 md:block">
              <Image
                src="/good-deal.jpg"
                alt="s"
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
        <section className="mx-auto w-full max-w-7xl py-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-primary">
              Подобрано 25 предложений
            </h3>
            <span className="text-sm text-foreground/60">
              Показываем только самые лучшие предложения
            </span>
          </div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              type="text"
              placeholder="Поиск по банку"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full md:w-1/3 rounded-full border border-foreground/15 px-4 text-sm text-foreground"
            />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6 backdrop-blur-xl shadow-[0_0_30px_-15px_rgba(0,0,0,0.25)]">
            <div className="grid gap-6 md:grid-cols-2">
              {filteredBanks.length > 0 ? (
                filteredBanks.slice(0, visibleOffers).map((bank, i) => (
                  <div
                    key={i}
                    className="relative flex items-center gap-4 rounded-2xl border border-foreground/10 bg-white/5 p-5 hover:border-primary/50 hover:shadow-primary/20 shadow-2xl transition-all hover:-translate-y-1"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 text-2xl font-semibold text-primary">
                        {bank.name}
                      </div>
                      <div className="text-xs text-foreground/70">
                        Сумма: до 500 млн ₽ · Срок: до 2600 дн · Комиссия: от
                        1.8%
                      </div>
                    </div>
                    <Link href="#application">
                      <Button className="shrink-0 text-primary rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md bg-none border-2 border-primary hover:bg-primary hover:text-white hover:text-[oklch(0.141_0.005_285.823)] cursor-pointer">
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
        <SeeAlso currentPage="credits" />
      </FadeIn>
      <FadeIn>
        <FaqSection
          title="Вопросы по кредитам для бизнеса"
          items={visibleFaqs}
          titleClassName="mb-6 text-4xl font-bold text-primary text-center"
        >
          {faqs.length > 7 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn-three h-12 font-semibold"
              >
                {showAll ? "Скрыть" : "Показать все"}
              </button>
            </div>
          )}
        </FaqSection>
      </FadeIn>

      <section className="mx-auto mt-2 w-full max-w-7xl py-8">
        <div className="mb-4 flex flex-col md:flex-row items-end justify-between gap-4">
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
        <ManagerCTASection />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-12">
          <h2 className="mb-10 text-4xl font-bold text-primary text-center">
            Часто ищут
          </h2>

          <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
              {[
                "кредит для бизнеса",
                "кредитная линия",
                "оборотный кредит",
                "коммерческий кредит",
                "кредит на развития",
                "кредиты мал бизнесу",
                "кредит среднему бизнесу",
                "кредит для ип",
                "кредит для ооо",
                "кредит для юридических лиц",
                "кредит на оборотные средства",
                "кредит на пополнение оборотных средств",
                "кредит для бизнеса без залога",
                "кредит под залог коммерческой недвижимости",
                "кредит на проект",
                "кредит инвестиционных проектов",
                "кредит коммерческим организациям",
                "финансовый коммерческий кредит",
                "коммерческие кредиты предприятиям",
                "кредит под предприятие",
                "банковские кредиты предприятиям",
                "финансовые кредиты предприятию",
                "кредит для предприятия",
                "привлечение кредита предприятием",
                "кредит под производство",
                "кредит на развития производства",
                "кредит на завод",
                "сельхоз кредит",
                "кредит для селлеров",
                "кредиты на туризм",
                "ипотека на коммерческую недвижимость",
                "коммерческая ипотека",
                "льготный кредит бизнесу",
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
