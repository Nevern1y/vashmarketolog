import BankLogosSlider from "@/components/BankLogosSlider";
import FadeIn from "@/components/FadeIn";
import ManagerCTASection from "@/components/ManagerCTASection";
import SeeAlso from "@/components/see-also";
import TenderSupportForm from "@/components/TenderSupportForm";
import { Button } from "@/components/ui/button";
import type { SeoPageData } from "@/lib/seo-api";
import Link from "next/link";

const guarantees = [
  {
    title: "100% допуска к аукциону",
    description:
      "Гарантируем ваше участие в торгах и берём на себя проверку документации.",
  },
  {
    title: "Опыт более 30 лет",
    description:
      "Совокупный опыт команды сопровождения — десятки лет и тысячи выигранных закупок.",
  },
  {
    title: "Заявки без ограничений",
    description:
      "Помогаем подать любое количество заявок на участие — без лимитов по объёму.",
  },
  {
    title: "Низкий процент КВ",
    description:
      "Один из самых низких процентов комиссионного вознаграждения за победу.",
  },
];

const workflow = [
  {
    title: "Индивидуальный подбор тендеров",
    text: "Подбираем закупки под ваши параметры, помогаем найти клиентов, сотрудников, партнёров или сменить подрядчика.",
  },
  {
    title: "Анализ на наличие коррупции",
    text: "Защищаем вас от недобросовестных заказчиков, готовим официальные обращения в ФАС при необходимости.",
  },
  {
    title: "Подготовка документации",
    text: "Подаём заявки на участие, готовим документы и обеспечиваем полное юридическое сопровождение.",
  },
  {
    title: "Оформление банковской гарантии",
    text: "Получаем любые виды банковских гарантий через собственный маркетплейс — быстро и просто.",
  },
  {
    title: "Заключение контракта",
    text: "Согласовываем договор с заказчиком, готовим протокол разногласий и сопровождаем подписание.",
  },
  {
    title: "Финансирование исполнения",
    text: "Помогаем получить кредиты и финансовые услуги для исполнения контракта на выгодных условиях.",
  },
];

const tenderTypes = [
  {
    title: "Госзакупки по 44‑ФЗ",
    description:
      "Сопровождаем участников закупок по 44‑ФЗ: от поиска тендера до подачи заявки и контроля статуса.",
  },
  {
    title: "Закупки по 223‑ФЗ",
    description:
      "Берём на себя сопровождение при участии в тендерах 223‑ФЗ и выстраиваем коммуникацию с заказчиками.",
  },
  {
    title: "Коммерческие закупки",
    description:
      "Помогаем участвовать в коммерческих торгах, готовим документы и сопровождаем переговоры.",
  },
  {
    title: "Имущественные торги",
    description:
      "Аукционы по аренде, реализации имущества и банкротству — анализируем риски и готовим стратегию участия.",
  },
];

const defaultPopularSearches = [
  { text: "Электронный тендер", href: "/v-razrabotke" },
  { text: "Участие в тендерах", href: "/v-razrabotke" },
  { text: "Тендеры на строительство", href: "/v-razrabotke" },
  { text: "Строительные тендеры", href: "/v-razrabotke" },
  { text: "Поиск тендеров", href: "/v-razrabotke" },
  { text: "Тендеры и закупки", href: "/v-razrabotke" },
  { text: "Специалист по тендерам", href: "/v-razrabotke" },
  { text: "Коммерческие тендеры", href: "/v-razrabotke" },
  { text: "Государственные тендеры", href: "/v-razrabotke" },
  { text: "Сопровождение тендеров", href: "/v-razrabotke" },
  { text: "Аутсорсинг тендеров", href: "/v-razrabotke" },
  { text: "Ведение тендеров", href: "/v-razrabotke" },
  { text: "Специалист по закупкам", href: "/v-razrabotke" },
  { text: "Менеджер по закупкам", href: "/v-razrabotke" },
  { text: "Тендеры", href: "/v-razrabotke" },
  { text: "Госконтракты", href: "/v-razrabotke" },
  { text: "Госзаказ", href: "/v-razrabotke" },
  { text: "Закупки", href: "/v-razrabotke" },
  { text: "Госзакупки", href: "/v-razrabotke" },
  { text: "Подача заявок тендер", href: "/v-razrabotke" },
  { text: "Подача заявки на участие в тендерах", href: "/v-razrabotke" },
];

interface TenderSupportClientProps {
  seoPage?: SeoPageData | null;
}

const normalizePopularSearches = (
  searches: SeoPageData["popular_searches"] | undefined,
) => {
  if (!Array.isArray(searches) || searches.length === 0) {
    return defaultPopularSearches;
  }

  const normalized = searches
    .map((item) => {
      if (typeof item === "string") {
        const text = item.trim();
        return text ? { text, href: "#application" } : null;
      }

      const text = String(item?.text || "").trim();
      if (!text) return null;

      const href = String(item?.href || "#application").trim() || "#application";
      return { text, href };
    })
    .filter((item): item is { text: string; href: string } => item !== null);

  return normalized.length > 0 ? normalized : defaultPopularSearches;
};

export default function TenderSupportClient({ seoPage }: TenderSupportClientProps) {
  const heroTitle = seoPage?.h1_title?.trim() || "Тендерное сопровождение";
  const heroDescription =
    seoPage?.main_description?.trim() ||
    "Бесплатная консультация специалиста — узнайте про закупки все!";
  const heroButtonText = seoPage?.hero_button_text?.trim() || "Свяжитесь со мной!";
  const heroButtonHref = seoPage?.hero_button_href?.trim() || "#tender-support-form";
  const popularSearches = normalizePopularSearches(seoPage?.popular_searches);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-2">
            <div className="space-y-5">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                {heroTitle}
              </h1>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary/80">
                от поиска до сопровождения
              </p>
              <p className="max-w-2xl text-base text-foreground/80 md:text-lg">
                {heroDescription}
              </p>
              <Button asChild className="h-11 btn-three">
                <a href={heroButtonHref}>{heroButtonText}</a>
              </Button>
            </div>
          </div>
        </section>
      </FadeIn>
      <FadeIn>
        <BankLogosSlider />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-10 w-full max-w-7xl">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            Наши гарантии вашего успеха
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {guarantees.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-foreground/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_15px_35px_-25px_rgba(15,23,42,0.9)]"
              >
                <p className="text-sm uppercase text-primary/70">
                  {item.title}
                </p>
                <p className="mt-3 text-sm text-foreground/80">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <TenderSupportForm />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-12 w-full max-w-7xl">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            Как мы работаем
          </h2>
          <ol className="space-y-4">
            {workflow.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 rounded-2xl border border-foreground/10 bg-white/5 p-5 md:flex-row md:items-start"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="text-sm text-foreground/75">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </FadeIn>
      <FadeIn>
        <section className="mx-auto mt-12 w-full max-w-7xl">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            Все типы тендеров
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {tenderTypes.map((type) => (
              <div
                key={type.title}
                className="rounded-3xl border border-foreground/10 bg-white/5 p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.55)]"
              >
                <p className="text-base font-semibold text-foreground">
                  {type.title}
                </p>
                <p className="mt-3 text-sm text-foreground/75">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>
      <FadeIn>
        <SeeAlso />
      </FadeIn>
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
              {popularSearches.map((item, i) => (
                <div key={`${item.text}-${i}`}>
                  {item.href.startsWith("http://") || item.href.startsWith("https://") ? (
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
