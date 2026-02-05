import Link from "next/link";
import FadeIn from "@/components/FadeIn";

export const metadata = {
  title: "Карта сайта - Лидер Гарант",
  description: "Карта сайта компании Лидер Гарант - все страницы и разделы",
};

export default function SitemapPage() {
  const sections = [
    {
      title: "Финансовые продукты",
      links: [
        { href: "/bankovskie-garantii", label: "Банковские гарантии" },
        { href: "/kredity-dlya-biznesa", label: "Финансирование контракта" },
        { href: "/lising-dlya-urlic", label: "Лизинг для юрлиц" },
        { href: "/factoring-dlya-biznesa", label: "Факторинг" },
        { href: "/rko", label: "РКО" },
        { href: "/deposity", label: "Вклады" },
        { href: "/strahovanie", label: "Страхование СМР" },
        { href: "/ved", label: "Международные платежи" },
      ],
    },
    {
      title: "Услуги",
      links: [
        {
          href: "/tendernoe-soprovojdenie",
          label: "Тендерное сопровождение",
        },
        { href: "/proverka-contragentov", label: "Проверка контрагентов" },
      ],
    },
    {
      title: "О компании",
      links: [
        { href: "/o-proekte", label: "О проекте" },
        { href: "/novosti", label: "Новости" },
        { href: "/vacansii", label: "Вакансии" },
        { href: "/agents", label: "Агентам" },
        { href: "/partneram", label: "Партнерам" },
      ],
    },
    {
      title: "Информация",
      links: [
        { href: "/contact", label: "Контакты" },
        { href: "/documenty", label: "Документы" },
        { href: "/privacy-policy", label: "Политика конфиденциальности" },
      ],
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
      <FadeIn>
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl md:text-5xl font-bold text-primary">
            Карта сайта
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Все страницы и разделы сайта Лидер Гарант
          </p>
        </section>

        <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section, index) => (
            <FadeIn key={index}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-primary">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <Link
                        href={link.href}
                        className="group flex items-center gap-2 text-sm text-foreground/80 hover:text-primary transition-all duration-200"
                      >
                        <span className="text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-transform duration-200">
                          →
                        </span>
                        <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn>
          <div className="mt-12 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 p-8 md:p-10 backdrop-blur-xl text-center hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl md:text-3xl font-bold text-primary">
              Нужна помощь?
            </h2>
            <p className="mb-6 text-base md:text-lg text-foreground/70 max-w-2xl mx-auto">
              Не нашли нужную информацию? Свяжитесь с нами, и мы с радостью вам
              поможем
            </p>
            <Link
              href="/contact"
              className="inline-flex rounded-xl border border-primary px-8 py-3 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-[oklch(0.141_0.005_285.823)] hover:-translate-y-1 hover:shadow-md"
            >
              Связаться с нами
            </Link>
          </div>
        </FadeIn>
      </FadeIn>
    </main>
  );
}
