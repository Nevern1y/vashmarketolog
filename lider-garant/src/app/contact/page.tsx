"use client";

import FadeIn from "@/components/FadeIn";
import { MapPin, Phone, Clock, Mail } from "lucide-react";
import Image from "next/image";

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16 space-y-12">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
              Служба поддержки
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              <span className="text-primary">Контакты</span>
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Свяжитесь с нами любым удобным способом — мы всегда готовы помочь
            </p>
          </div>
        </section>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        <FadeIn delay={0.1}>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-indigo-500/5 via-transparent to-sky-500/5 p-6 transition-all hover:border-primary/30">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Адрес</h2>
                <p className="mt-1 text-muted-foreground">
                  129085, г. Москва, Проспект мира 105
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-sky-500/5 via-transparent to-emerald-500/5 p-6 transition-all hover:border-primary/30">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Служба поддержки
                </h2>
                <a
                  href="tel:+74957452720"
                  className="mt-1 block text-lg font-medium text-primary hover:underline"
                >
                  +7 (495) 745-27-20
                </a>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-emerald-500/5 via-transparent to-indigo-500/5 p-6 transition-all hover:border-primary/30">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Время работы
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Ежедневно с 7 до 20 Мск
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-violet-500/5 via-transparent to-sky-500/5 p-6 transition-all hover:border-primary/30">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Email</h2>
                <a
                  href="mailto:support@lider-garant.ru"
                  className="mt-1 block text-primary hover:underline"
                >
                  support@lider-garant.ru
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Мессенджеры */}
      <FadeIn delay={0.5}>
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Напишите нам
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <a
            href="https://t.me/lider_garant"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/5 via-transparent to-blue-600/5 p-6 transition-all hover:border-primary/30"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                <Image
                  src="/tg-logo.webp"
                  alt="Telegram"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  Написать в Телеграм
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ответим в течение часа
                </p>
              </div>
            </div>
          </a>

          <a
            href="https://max.ru/u/f9LHodD0cOIXEPJot15IEj_2EIeaAZsKSjeCGIcybYIybHk3HTuHQ3LCd-Y"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-indigo-500/5 via-transparent to-sky-500/5 p-6 transition-all hover:border-primary/30"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden">
                <Image
                  src="/MAX.svg"
                  alt="Max Icon"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  Написать в Макс
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ответим в течение часа
                </p>
              </div>
            </div>
          </a>
        </div>
      </FadeIn>

      <FadeIn delay={0.6}>
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Наши группы в соц. сетях
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <a
            href="https://t.me/lidergarant"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-sky-500/5 via-transparent to-blue-500/5 p-6 transition-all hover:border-primary/30"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                <Image
                  src="/tg-logo.webp"
                  alt="Telegram"
                  width={48}
                  height={48}
                  className="w-12 h-12"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  Telegram
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  @lider_garant
                </p>
              </div>
            </div>
          </a>

          <a
            href="https://vk.com/lider_garant"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/5 via-transparent to-indigo-500/5 p-6 transition-all hover:border-primary/30"
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
            <div className="relative flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden">
                <Image
                  src="/vk-logo.webp"
                  alt="VK"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  ВКонтакте
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  lider_garant
                </p>
              </div>
            </div>
          </a>
        </div>
      </FadeIn>
    </main>
  );
}
