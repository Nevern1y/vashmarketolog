"use client";
import FadeIn from "@/components/FadeIn";
import BankLogosSlider from "@/components/BankLogosSlider";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Phone } from "lucide-react";
import { useState } from "react";
import VacancyModal from "@/components/VacancyModal";

export default function Page() {
  const [selectedVacancy, setSelectedVacancy] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openVacancyModal = (vacancy: any) => {
    setSelectedVacancy(vacancy);
    setIsModalOpen(true);
  };

  const closeVacancyModal = () => {
    setIsModalOpen(false);
    setSelectedVacancy(null);
  };

  const vacancies = [
    {
      id: 1,
      title: "Рекрутер",
      salary: "от 55 000 до 75 000 ₽",
      image: "/vacansies/businessman-office-talking-phone.jpg",
      description: "Подбор персонала для различных отделов компании",
    },
    {
      id: 2,
      title: "Специалист call-центра",
      salary: "от 50 000 до 75 000 ₽",
      image:
        "/vacansies/young-customer-service-girl-with-headset-her-workplace-isolated-white-wall.jpg",
      description: "Консультирование клиентов по финансовым продуктам",
    },
    {
      id: 3,
      title: "Менеджер по работе с клиентами B2B",
      salary: "от 75 000 до 135 000 ₽",
      image: "/vacansies/happy-bearded-man-suit-talking-phone.jpg",
      description:
        "Работа с корпоративными клиентами, развитие партнерских отношений",
    },
    {
      id: 4,
      title: "Руководитель отдела продаж",
      salary: "от 100 000 до 300 000 ₽",
      image:
        "/vacansies/horizontal-portrait-unshaven-pleasant-looking-young-businessman-sits-working-desk.jpg",
      description: "Управление командой продаж, развитие клиентской базы",
    },
    {
      id: 5,
      title: "Помощник главного кредитного аналитика",
      salary: "от 45 000 до 65 000 ₽",
      image: "/vacansies/close-up-individual-working-laptop.jpg",
      description: "Анализ кредитных заявок, оценка рисков",
    },
    {
      id: 6,
      title: "Маркетолог",
      salary: "от 65 000 до 135 000 ₽",
      image:
        "/vacansies/young-serious-finance-manager-glasses-blue-shirt-sitting-company-office.jpg",
      description: "Разработка и реализация маркетинговых стратегий",
    },
    {
      id: 7,
      title: "Помощник руководителя",
      salary: "от 50 000 до 70 000 ₽",
      image: "/vacansies/businessman-office-talking-phone.jpg",
      description: "Организационная поддержка руководителя, документооборот",
    },
    {
      id: 8,
      title: "Специалист по обучению и развитию персонала",
      salary: "от 45 000 до 65 000 ₽",
      image:
        "/vacansies/young-customer-service-girl-with-headset-her-workplace-isolated-white-wall.jpg",
      description: "Разработка программ обучения, развитие сотрудников",
    },
    {
      id: 9,
      title: "Кредитный специалист",
      salary: "от 70 000 до 105 000 ₽",
      image: "/vacansies/happy-bearded-man-suit-talking-phone.jpg",
      description: "Оформление кредитных продуктов, консультирование клиентов",
    },
  ];

  const deals = Array.from({ length: 24 }).map((_, i) => ({
    title: [
      "Трудоустройство менеджера",
      "Подбор специалиста",
      "Кадровое решение",
      "HR консалтинг",
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
      q: "Какие преимущества работы в Лидер-Гарант?",
      a: `
Мы предлагаем:
- Конкурентную заработную плату и систему бонусов
- Официальное трудоустройство по ТК РФ
- ДМС после испытательного срока
- Обучение и профессиональное развитие
- Комфортный офис в центре Москвы
- Дружный коллектив и наставничество
      `,
    },
    {
      q: "Какой график работы у сотрудников?",
      a: `
Большинство должностей предполагают 5/2 график с 9:00 до 18:00.
Для call-центра возможен сменный график.
Гибкое начало дня обсуждается индивидуально с руководителем отдела.
      `,
    },
    {
      q: "Есть ли у вас удаленные вакансии?",
      a: `
Некоторые позиции допускают гибридный формат работы после испытательного срока.
Полностью удаленная работа возможна для определенных должностей в IT-отделе и для опытных специалистов.
      `,
    },
    {
      q: "Как проходит процесс отбора кандидатов?",
      a: `
Процесс отбора включает:
1. Анализ резюме и первичный контакт с HR
2. Тестовое задание (в зависимости от должности)
3. Собеседование с руководителем отдела
4. Финальное собеседование с руководством
Обычно процесс занимает 1-2 недели.
      `,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative text-center space-y-6">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              Открытые вакансии
            </h1>
            <div className="text-5xl font-bold text-primary md:text-7xl">
              Lider Garant
            </div>
            <p className="max-w-2xl mx-auto text-base text-foreground/80 md:text-lg">
              Присоединяйтесь к команде профессионалов в финансовой сфере. Мы
              предлагаем карьерные возможности и стабильное развитие.
            </p>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <BankLogosSlider />
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-8 w-full max-w-7xl py-10" id="vacansies">
          <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-primary md:text-3xl">
            Актуальные вакансии
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vacancies.map((vacancy) => (
              <div
                key={vacancy.id}
                onClick={() => openVacancyModal(vacancy)}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-primary/20 hover:-translate-y-1 cursor-pointer"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={vacancy.image}
                    alt={vacancy.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {vacancy.title}
                  </h3>
                  <p className="text-foreground/70 text-sm">
                    {vacancy.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-lg text-foreground/60">
                      {vacancy.salary}
                    </span>
                    <span className="text-primary font-medium hover:text-primary/80 transition-colors inline-flex items-center gap-1">
                      Подробнее →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-8 w-full max-w-7xl py-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Стань частью нашей команды
                </h2>
                <p className="max-w-2xl text-base text-foreground/80 md:text-lg">
                  Присоединяйтесь к динамично развивающейся компании в
                  финансовой сфере. Мы предлагаем отличные условия для роста и
                  профессионального развития.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="h-12 btn-three">
                    <a href="#vacansies">Откликнуться</a>
                  </Button>
                  <Button
                    asChild
                    className="h-12 bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-[oklch(0.141_0.005_285.823)]"
                  >
                    <a href="tel:+79652841415">Позвонить</a>
                  </Button>
                </div>
              </div>

              <div className="relative hidden h-80 w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl md:flex items-center justify-center">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
                <Image
                  src="/help-manager.jpg"
                  alt="Резюме"
                  width={400}
                  height={400}
                  className="h-72 w-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-8 w-full max-w-7xl py-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative grid items-center gap-8 md:grid-cols-2">
              <div className="relative hidden h-[320px] w-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl md:flex items-center justify-center">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
                <Image
                  src="/application-form-women.png"
                  alt="Lider Garant"
                  width={400}
                  height={400}
                  className="h-72 w-auto object-contain rounded-2xl"
                />
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Расти и развивайся с <br />
                  <span className="text-primary">Lider Garant</span>
                </h2>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                    <h3 className="text-xl font-semibold text-primary mb-3">
                      Давай работать вместе!
                    </h3>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      "Мы ищем талантливых специалистов, которые готовы расти
                      вместе с нами. Lider Garant — это место, где ваш
                      профессионализм ценится и развивается."
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        HR отдел
                      </div>
                      <a
                        href="tel:+79652841415"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        +7 (965) 284-14-15
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <a
                      href="https://wa.me/79652841415"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="MAX"
                    >
                      <a href="https://logo-teka.com/max/">
                        <img
                          src="https://logo-teka.com/wp-content/uploads/2025/07/max-messenger-sign-logo.png"
                          alt="PNG logo Max"
                          width={47}
                        />
                      </a>
                    </a>
                    <a
                      href="https://t.me/+79652841415"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Telegram"
                    >
                      <img src="/tg-logo.webp" alt="" className="w-15 h-15" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <VacancyModal
        vacancy={selectedVacancy}
        open={isModalOpen}
        onClose={closeVacancyModal}
      />
    </main>
  );
}
