"use client";

import FadeIn from "@/components/FadeIn";
import {
  Shield,
  Database,
  Users,
  FileText,
  Clock,
  Lock,
  CheckCircle,
  BarChart,
} from "lucide-react";

const features = [
  {
    title: "Сбор и обработка информации",
    description:
      "Предназначена для сбора, получения, обработки, хранения и предоставления информации о субъектах малого и среднего бизнеса (МСБ), потенциально нуждающихся в финансовой поддержке.",
    Icon: Database,
  },
  {
    title: "Разработка ПО и консалтинг",
    description:
      "Разрабатывает компьютерное программное обеспечение, занимается консультативной деятельностью в области компьютерных технологий, деятельностью по созданию и использованию баз данных и информационных ресурсов.",
    Icon: FileText,
  },
  {
    title: "Решение для целевых групп",
    description:
      "Решает задачи для двух целевых групп Банков и участников/победителей государственных и коммерческих аукционов и тендеров, а также их агентов.",
    Icon: Users,
  },
];

const capabilities = [
  {
    title: "Единая информационная база",
    description:
      "Единой информационная база о субъектах МСБ потенциально нуждающихся в финансовой поддержке, предусматривающей структуризацию данных по каналам поступления информации.",
    Icon: Database,
  },
  {
    title: "Информационный центр",
    description:
      "Единого информационный центр подачи, формирования заявок на гарантию, кредит (в том числе прямое кредитование субъекта МСБ), или поручительство.",
    Icon: FileText,
  },
  {
    title: "История взаимодействий",
    description:
      "Единой информационная база данных по истории взаимодействия субъектов МСБ с участниками взаимодействия и партнерами.",
    Icon: BarChart,
  },
  {
    title: "Многоканальность",
    description:
      "Многоканальность поступления заявок от субъектов МСБ, участников взаимодействия, партнёров.",
    Icon: Users,
  },
  {
    title: "Автоматизация процессов",
    description:
      "Автоматизация бизнес-процессов прохождения и рассмотрения заявок.",
    Icon: CheckCircle,
  },
  {
    title: "Контроль сроков",
    description: "Автоматизация контроля сроков прохождения заявки.",
    Icon: Clock,
  },
  {
    title: "Стандарты работы",
    description:
      "Обеспечение соблюдения стандартов работы с заявками МСБ за счет минимизации ручных операций по обработке заявок МСБ.",
    Icon: Shield,
  },
  {
    title: "Стандартизация отчетности",
    description:
      "Автоматизация и стандартизация отчётности для участников взаимодействия.",
    Icon: BarChart,
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16 space-y-12">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
              Цифровая интернет-площадка финансовых услуг
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              <span className="text-primary">Lider Garant</span> — финансовая
              платформа
            </h1>
            <p className="max-w-2xl text-base text-foreground/75 md:text-lg">
              Управления заявками обращающихся за финансовой помощью в рамках
              системы, предназначенной для предоставления гарантий, кредитов и
              поручительств субъектам и Банкам в едином информационном
              пространстве по единым стандартам.
            </p>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="grid gap-6 md:grid-cols-3">
          {features.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="rounded-3xl border border-foreground/10 bg-white/5 p-6 shadow-sm transition-all hover:border-primary hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
            >
              <Icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-3">
                {title}
              </h3>
              <p className="text-sm text-foreground/75">{description}</p>
            </div>
          ))}
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-foreground/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-primary md:text-3xl">
            Возможности платформы
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            Комплексное решение для автоматизации и стандартизации финансовых
            процессов.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition-all hover:border-primary hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
              >
                <Icon className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground mb-1">{title}</h4>
                  <p className="text-xs text-foreground/70">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-primary/10 to-primary/5 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
              Надежность и безопасность
            </h2>
          </div>
          <div className="space-y-4">
            <p className="text-base text-foreground/80">
              Соблюдаем 152-ФЗ. Для передачи данных используем средства
              криптографической защиты информации отвечающие классу защиты КС-2
            </p>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
