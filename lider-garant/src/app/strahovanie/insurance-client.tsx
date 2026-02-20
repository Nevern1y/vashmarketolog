"use client";
import FadeIn from "@/components/FadeIn";
import BankLogosSlider from "@/components/BankLogosSlider";
import ManagerCTASection from "@/components/ManagerCTASection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import Image from "next/image";
import FaqSection from "@/components/FaqSection";
import { CheckCheck } from "lucide-react";
import Link from "next/link";
import WhyUs from "@/components/Why-us";
import DealFeed from "@/components/deal-feed";
import SeeAlso from "@/components/see-also";
import { Label } from "@radix-ui/react-label";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";
import type { SeoPageData } from "@/lib/seo-api";
import { normalizePopularSearches } from "@/lib/popular-searches";

const defaultPopularSearchTerms = [
  "Страхование строительно-монтажных работ (СМР)",
  "Страхование проектов в гос закупках",
  "Страхование рисков проекта",
  "Страхование профессиональной ответственности туроператора",
  "Страхование профессиональной ответственности проектировщиков",
  "Страхование профессиональной ответственности строителей",
  "Страхование профессиональной ответственности ЧОП",
  "Страхование ответственности перевозчика и экспедитора",
  "Страхование ответственности собственника / арендатора",
  "Страхование экологических рисков",
  "Страхование гражданской ответственности",
  "Страхование договорных обязательств членов СРО (ОДО)",
  "страхования гражданской ответственности перевозчика (ОСГОП)",
  "Страхование имущества юридических лиц",
  "Страхование грузов при транспортировке",
  "Корпоративное страхование сотрудников",
  "Страхование имущества организаций",
  "Титульное страхование для компаний",
  "Страхование гражданской ответственности юридических лиц",
  "Добровольное медицинское страхование",
  "Страхование товарно-материальных ценностей",
  "Страхование ответственности за качество продукции",
  "Страхование ответственности директоров",
  "Страхование дебиторской задолженности",
  "Страхование авансовых платежей",
  "Страхование транспорта компаний",
  "Страхование от перерыва в коммерческой деятельности",
  "Строительно-монтажное страхование",
  "Экологическое страхование",
  "Страхование от огня",
  "Киберстрахование",
  "Страхование от терроризма",
  "Страхование складского бизнеса",
  "Страхование транспортных компаний",
  "Страхование железнодорожного транспорта",
  "Страхование промышленных предприятий",
  "Страхование энергетической инфраструктуры",
  "Страхование нефтебаз",
  "Страхование IT компаний",
  "Страхование дата-центров и коммуникационого оборудования",
  "Страхование банков",
  "Страхование магазинов и розничных сетей",
  "Страхование агропромышленного комплекса",
  "Страхование медицинских учреждений",
  "Страхование предметов искусства",
  "Страхование спортивных организаций",
  "Страхование гостиниц",
  "Авиационное страхование",
];

interface InsurancePageProps {
  seoPage?: SeoPageData | null;
}

export default function Page({ seoPage }: InsurancePageProps) {
  const popularSearches = normalizePopularSearches(
    seoPage?.popular_searches,
    defaultPopularSearchTerms,
    "#insurance-form",
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
      const result = await submitLead({
        full_name: data.fullname.trim(),
        phone: data.phone,
        inn: data.inn,
        amount: Number(data.amount),
        product_type: "insurance",
        source: "website_form",
        form_name: "insurance_form",
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

  const responsibility = [
    "Гражданская ответственность перевозчика (пассажиры)",
    "Ответственность членов СРО/ОДО (фин.риски и СМР)",
    "ОСГОП/ОСГОП (обязательное)",
    "Профессиональная ответственность (ЧОП, проектировщики, туроператор)",
  ];

  const propertyAndCargo = [
    "Разовая перевозка",
    "Перевозчик",
    "Имущество",
    "Ипотека",
  ];

  const accidents = [
    "Страхование от несчастных случаев",
    "Страхование спортсменов (дети и взрослые)",
    "Добровольное страхование от НС",
    "Несчастные случаи при исполнении трудовых обязанностей",
  ];

  const benefits = [
    "Выгодные предложения от ТОП страховщиков",
    "Улучшение условий по действующим договорам",
    "Договор и полисы в удобном режиме",
    "Страхуем во всех субъектах РФ, включая новые",
  ];

  const deals = Array.from({ length: 24 }).map((_, i) => ({
    title: [
      "Страхование строительно-монтажные риски",
      "Страхование ответственности членов СРО",
      "Страхование имущества и груза",
      "ГО за причинение вреда третьим лицам",
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
      q: "Какие виды страхования строительных рисков мы предоставляем?",
      a: `
- Страхование строительно-монтажных работ (СМР)
- Страхование гражданской ответственности при выполнении строительно-монтажных работ
- Страхование пусконаладочных работ
- Страхование послепусковых гарантийных обязательств
- Страхование профессиональной ответственности строительных компаний
- Страхование ответственности за нарушение договорных обязательств
- Страхование строительной спецтехники
- Страхование рабочих от несчастных случаев
- Убытки от перерывов в строительстве
`,
    },
    {
      q: "От чего зависит стоимость страхования строительных рисков?",
      a: `
- Размер и сложность проекта
- Сроки строительства
- Типы рисков
- История страхователя
`,
    },
    {
      q: "Какие риски покрывает страхование строительно-монтажных работ (СМР)?",
      a: `
Покрывает риски, связанные с объектом строительства, монтажом, ремонтом, строительными материалами, оборудованием и техникой на площадке.
`,
    },
    {
      q: "Какие преимущества страхования строительно-монтажных рисков (СМР)?",
      a: `
- Защищает подрядчиков, девелоперов и инвесторов
- Повышает доверие инвесторов
- Часто обязательно для получения кредита на строительство
`,
    },
    {
      q: "От чего застраховать?",
      a: `
- Пожар и взрыв
- Стихийные бедствия
- Противоправные действия третьих лиц
- Ошибки при проектировании
- Ошибки при монтаже и проведении работ
- Аварии и внешнее воздействие
`,
    },
    {
      q: "Что обеспечивает полис СМР?",
      a: `
- Объекты строительных и монтажных работ
- Строительная техника
- Стройматериалы и оборудование
- Инженерные сети
- Пусконаладочные работы
- Ответственность перед третьими лицами
`,
    },
    {
      q: "На какие виды транспорта действует страхование гражданской ответственности перевозчика (ОСГОП)?",
      a: `
- Железнодорожный транспорт (пригородные электропоезда и поезда дальнего следования)
- Автобусы, в том числе маршрутки
- Внеуличный транспорт (лёгкое метро, монорельсовый транспорт и внеуличный трамвай)
- Трамвай
- Троллейбус
- Морской транспорт
- Внутренний водный транспорт
- Воздушный транспорт (самолёт, вертолёт)
`,
    },
    {
      q: "В каких случаях необходимо страхование профессиональной ответственности?",
      a: `
- Медицинские и фармацевтические учреждения
- Юридические фирмы и адвокаты
- Аудиторские и бухгалтерские компании
- Консалтинговые компании
- Инженерные и строительные компании
`,
    },
    {
      q: "Какие страховые риски покрывает страхование профессиональной ответственности?",
      a: `
1. Убытки клиентов, вызванные ошибками в работе
2. Компенсация морального ущерба
3. Судебные издержки и юридическое сопровождение
4. Возмещение расходов на исправление ошибок
5. Компенсация за потерю репутации
`,
    },
    {
      q: "Что такое страхование имущества юридических лиц?",
      a: `
Комплексная защита материальных активов бизнеса:
- Здания и помещения: офисы, склады, производственные помещения
- Производственное оборудование: мебель, электронное и производственное оборудование
- Товары в обороте: товары на производстве и складах
`,
    },
    {
      q: "Для кого подходит страхование имущества юридических лиц?",
      a: `
- Офисы и коворкинги
- Магазины в ТЦ и отдельно стоящие
- Небольшие производства
- Рестораны и кафе
- Гостиницы
- Аптеки и склады
`,
    },
    {
      q: "Какие страховые риски покрывает страхование от несчастных случаев сотрудников?",
      a: `
- Физическая травма/увечье в результате несчастного случая
- Установление группы инвалидности в результате несчастного случая или болезни
- Смерть в результате несчастного случая или болезни
- Первичное диагностирование критического заболевания
- Госпитализация в результате несчастного случая или болезни
- Проведение хирургической операции в связи с несчастным случаем или болезнью
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
              <h1 className="text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                Страхование бизнеса
              </h1>
              <p className="max-w-2xl text-base text-foreground/80 md:text-lg">
                Страхование деятельности юридического лица, обеспечит надежную
                защиту от действий третьих лиц, связанных с риском утраты,
                повреждения или уничтожения дорогостоящего имущества и
                оборудования.
              </p>
              <div className="flex items-center gap-3">
                <Button asChild className="btn-three h-12">
                  <a href="#insurance-form">Запросить предложение онлайн</a>
                </Button>
              </div>
              <div className="mt-4 grid w-full max-w-md grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
                  <div className="text-3xl font-bold text-foreground">14</div>
                  <div className="text-xs text-foreground/70">
                    страховых компаний
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
                  <div className="text-3xl font-bold text-foreground">125</div>
                  <div className="text-xs text-foreground/70">
                    видов страхования
                  </div>
                </div>
              </div>
            </div>

            <div className="relative hidden h-[360px] w-full overflow-hidden rounded-3xl md:flex items-center justify-center">
              <div className="absolute bottom-2 right-5 space-y-3 z-20">
                <div className="flex items-center gap-3 rounded-lg bg-background/60 border border-white/10 px-3 py-2 backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCheck className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Персональный менеджер 24/7
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-background/60 border border-white/10 px-3 py-2 backdrop-blur-md">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    <CheckCheck className="h-3 w-3" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    Индивидуальный расчет и оформление онлайн
                  </span>
                </div>
              </div>

              <Image
                src="/insuarance.jpg"
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
        <WhyUs variant="insurance" />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-8 w-full max-w-7xl py-10">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Виды страхования юридических лиц
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden hover:border-primary/50 hover:shadow-primary/30 rounded-3xl border border-white/10 bg-white/5 p-6 pr-28 md:pr-40 min-h-[180px] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Строительно-монтажные риски
              </div>
              <ul className="space-y-2 text-sm text-foreground/85">
                {[
                  "Строительно-монтажные риски",
                  "СМР, Ответственность",
                  "СМР, Ответственность, ППГО",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="pointer-events-none absolute -right-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
              <Image
                aria-hidden
                src="/casca.png"
                alt=""
                width={220}
                height={220}
                className="pointer-events-none absolute -bottom-2 -right-2 h-36 w-36 md:h-44 md:w-44 object-contain"
              />
            </div>
            <div className="relative overflow-hidden hover:border-primary/50 hover:shadow-primary/30 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Все виды страхования ответственности
              </div>
              <ul className="space-y-2 text-sm text-foreground/85">
                {responsibility.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="pointer-events-none absolute -right-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
              <Image
                aria-hidden
                src="/shield.png"
                alt=""
                width={220}
                height={220}
                className="pointer-events-none absolute bottom-6 -right-6 h-36 w-36 md:h-44 md:w-44 object-contain"
              />
            </div>
            <div className="relative hover:border-primary/50 hover:shadow-primary/30 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Имущество и грузы
              </div>
              <ul className="space-y-2 text-sm text-foreground/85">
                {propertyAndCargo.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="pointer-events-none absolute -right-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
              <Image
                aria-hidden
                src="/cart-and-box.png"
                alt=""
                width={220}
                height={220}
                className="pointer-events-none absolute -bottom-2 -right-2 h-36 w-36 md:h-44 md:w-44 object-contain"
              />
            </div>
            <div className="relative hover:border-primary/50 hover:shadow-primary/30 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="mb-3 text-lg font-semibold text-foreground">
                Страхование от несчастных случаев
              </div>
              <ul className="space-y-2 text-sm text-foreground/85">
                {accidents.map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="pointer-events-none absolute -right-6 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
              <Image
                aria-hidden
                src="/circle.png"
                alt=""
                width={220}
                height={220}
                className="pointer-events-none absolute -bottom-2 -right-2 h-36 w-36 md:h-44 md:w-44 object-contain"
              />
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-2 w-full max-w-7xl py-10">
          <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Преимущества страхования юр лиц
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((t, i) => (
              <div
                key={t}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-foreground/85 backdrop-blur-md"
              >
                <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-foreground">
                  {i + 1}
                </div>
                <div className="leading-snug">{t}</div>
              </div>
            ))}
          </div>
        </section>
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
        <FaqSection
          title="Вопросы по страхованию юридических лиц"
          items={faqs}
        />
      </FadeIn>

      <FadeIn>
        <section
          id="insurance-form"
          className="mx-auto mt-2 w-full max-w-7xl py-12"
        >
          <div className="grid items-stretch gap-10 md:grid-cols-2">
            <div>
              <h2 className="mb-4 text-2xl font-semibold text-foreground">
                Подберем самые выгодные предложения
              </h2>
              <p className="mb-6 text-sm text-foreground/70">
                Заполните форму, выберите среди предложений лучшее, получите
                полис и защитите бизнес.
              </p>
              <form
                id="insurance-application"
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
                      min={1}
                      step="any"
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
                        className="h-5 w-5 rounded border border-gray-300 accent-primary focus:ring-2 focus:ring-primary/30"
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
            <div className="relative hidden min-h-[260px] rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 md:block">
              <Image
                src="/good-deal.jpg"
                alt="s"
                fill
                className="object-cover object-center rounded-3xl"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
                priority
              />
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <SeeAlso currentPage="insurance" />
      </FadeIn>

      <FadeIn>
        <ManagerCTASection />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-12">
          <h2 className="mb-10 text-2xl font-bold text-center text-primary md:text-3xl">
            Часто ищут
          </h2>

          <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
    </main>
  );
}
