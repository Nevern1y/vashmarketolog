"use client";

import FadeIn from "@/components/FadeIn";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const advantages = [
  {
    title: "Проверяем клиентов",
    description:
      "Система самостоятельно проверит клиентов, которые подходят под условия вашего продукта.",
  },
  {
    title: "Личный кабинет",
    description:
      "Вы получаете доступ для управления сделками Lider-Garant с индивидуальными настройками прав доступа.",
  },
  {
    title: "Анализ продуктов",
    description:
      "Помогаем доработать или разработать конкурентный продукт и вывести его на рынок.",
  },
  {
    title: "Оценка финансового состояния клиента",
    description:
      "Оцениваем финансовое состояние по параметрам скоринга банка и готовим сведения для присвоения категории заемщика по методике банка.",
  },
  {
    title: "Интеграция системы по API",
    description: "Полноценная интеграция по API с Вашей внутренней системой.",
  },
];

const mission = [
  "В лице Лидер-Гарант вы найдете надежного партнера и помощь в развитии продуктов и бизнес процессов для достижении общих целей",
  "Платформа Lider-Garant позволяет банкам работать с агентами и агрегаторами по привлечению клиентов на банковские продукты в сегменте малого и среднего бизнеса.",
];

const platform = [
  "1. Все виды гарантий и различных видов закупок: совместной, закрытой, многолодовой и закупки у единственного поставщика;",
  "2. Кредитов в любой форме: с единовременной выдачей, возобновляемых и невозобновляемых кредитных линий.",
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16 space-y-12">
      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
            Приглашаем банки, страховые и лизинговые компании, а также другие
            финансовые институты к сотрудничеству
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-4xl">
            Присоединитесь в маркетплейсу Лидер-Гарант для получения стабильного
            потока клиентов
          </h1>
          <Button className="mt-6 h-12 rounded-full px-8 bg-primary text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
            Оставить заявку
          </Button>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-primary">
            Преимущества работы
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-foreground/80 transition-all hover:border-primary hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
              >
                <p className="text-base font-semibold text-primary">
                  {item.title}
                </p>
                <p className="mt-3">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-primary">
            Наша задача - связать Банки с Клиентами по всей стране, для быстрого
            и удобного получения банковских продуктов
          </h2>
          <div className="mt-6 space-y-4 text-sm text-foreground/80">
            {mission.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-primary">
            Платформа разработана с учетом:
          </h2>
          <div className="mt-5 space-y-3 text-sm text-foreground/80">
            {platform.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-primary">
                Хотите стать партнером?
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                Оставьте заявку на сотрудничество — мы свяжемся с вами и обсудим
                условия интеграции и поток клиентов.
              </p>
            </div>
            <Button asChild className="h-12 btn-three whitespace-nowrap">
              <Link href="/contacts">Стать партнером</Link>
            </Button>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
