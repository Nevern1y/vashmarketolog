"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MessageSquareText, Phone } from "lucide-react";

export default function ManagerCTASection() {
  const pathname = usePathname();
  const applicationLink = pathname === "/" ? "#application" : "/#application";
  const cards = [
    {
      icon: CheckCircle2,
      title: "Подайте заявку",
      desc: "Перезвоним в течение 15 минут и подберём решение.",
      link: applicationLink,
      cta: "Отправить заявку",
    },
    {
      icon: Phone,
      title: "Позвоните нам",
      desc: "Звонок бесплатный по России.",
      link: "tel:+7(965)284-14-15 ",
      cta: "+7(965)284-14-15 ",
    },
    {
      icon: MessageSquareText,
      title: "Напишите нам",
      desc: "Отвечаем на почту в рабочее время.",
      link: "mailto:info@lider-garant.ru",
      cta: "info@lider-garant.ru",
    },
  ];
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-5">
      <div className="relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-foreground/15">
        <div className="relative grid gap-10 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-5">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.35em] text-foreground/70">
              Всегда на связи
            </p>
            <h2 className="mt-3 sm:mt-4 text-[24px] xs:text-[28px] sm:text-3xl md:text-[40px] font-semibold leading-tight text-primary">
              Вам всегда поможет персональный менеджер
            </h2>
            <p className="mt-3 sm:mt-4 max-w-xl text-[12px] sm:text-sm md:text-base text-foreground/70">
              Мы берём на себя организацию коммуникации: менеджер подключается в
              любом канале, следит за сроками и держит вас в курсе на каждом
              шаге.
            </p>

            <div className="mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
              {cards.map(({ icon: Icon, title, desc, link, cta }) => (
                <div
                  key={title}
                  className="group relative hover:shadow-xl hover:border-primary/50 hover:shadow-primary/10  rounded-2xl border border-foreground/10 bg-white/[0.03] 
                  pb-19 pt-5 px-5    
                  backdrop-blur-xl transition-all duration-300 
                  sm:hover:-translate-y-1 "
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 xs:h-10 xs:w-10 items-center justify-center rounded-2xl bg-primary text-white">
                      <Icon className="h-4 w-4 xs:h-5 xs:w-5" />
                    </span>
                    <div className="text-[13px] sm:text-sm font-semibold">
                      {title}
                    </div>
                  </div>
                  <p className="mt-2.5 text-[11px] sm:text-xs text-foreground/70">
                    {desc}
                  </p>
                  <Button
                    asChild
                    className="absolute bottom-5 left-4 right-4 sm:left-5 sm:right-5 h-10 rounded-2xl border-2 border-primary bg-transparent text-primary text-[11px] font-semibold uppercase tracking-wide hover:bg-primary hover:text-[oklch(0.141_0.005_285.823)] whitespace-nowrap"
                  >
                    <a href={link}>{cta}</a>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div
            className="order-first lg:order-0 rounded-2xl sm:rounded-3xl
             border border-foreground/10 bg-white/5
             p-6 sm:p-7 text-left text-foreground/80
             backdrop-blur-2xl min-h-[340px]
             grid grid-rows-[auto_minmax(0,1fr)_auto] mx-5"
          >
            <div className="pt-1">
              <div className="text-[10px] sm:text-[12px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
                Ваш менеджер
              </div>

              <p className="mt-1 text-3xl font-semibold text-primary">
                Лидер Гарант
              </p>
            </div>

            <div className="flex items-start justify-start px-4">
              <p className="text-[12px] sm:text-sm leading-relaxed text-foreground/75 max-w-[36ch]">
                Следит за сроками, помогает с документами и держит связь удобным
                для вас способом. Решаем вопросы даже вне рабочего времени,
                консультируем по любым нюансам, помогаем подготовить документы и
                выбрать оптимальные решения. Всегда на связи, чтобы вы были
                уверены в каждом шаге.
              </p>
            </div>

            <div className="mt-4 pb-1 flex flex-col items-start gap-3 text-[11px] sm:text-sm">
              <div className="w-full rounded-2xl border border-foreground/10 bg-white/10 px-3 py-3 text-foreground">
                График: 07:00 — 23:00 (МСК)
              </div>
              <div className="w-full rounded-2xl border border-foreground/10 bg-white/10 px-3 py-3 text-foreground">
                Каналы: телефон, почта, мессенджеры
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
