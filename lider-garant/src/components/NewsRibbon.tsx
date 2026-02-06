"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Button } from "@/components/ui/button";

const news = [
  {
    title: "Обновление условий банковских гарантий",
    date: "15.11.2025",
    excerpt: "Снижение ставок и упрощённый скоринг для малого бизнеса.",
  },
  {
    title: "Новый партнёр по лизингу",
    date: "10.11.2025",
    excerpt: "Запущены программы с авансом от 0% и ускоренным одобрением.",
  },
  {
    title: "ВЭД: прямые коррсчета",
    date: "05.11.2025",
    excerpt: "Подключили ещё два иностранных банка для удобных платежей.",
  },
  {
    title: "Страхование контрактов",
    date: "01.11.2025",
    excerpt: "Экспресс-полисы для контрактов свыше 30 млн руб.",
  },
  {
    title: "Тендерное сопровождение",
    date: "28.10.2025",
    excerpt: "Каждый третий тендер — победа. Расширили экспертизу.",
  },
  {
    title: "Расширение продуктовой линейки",
    date: "25.10.2025",
    excerpt: "Добавлены новые финансовые инструменты для бизнеса.",
  },
];

export default function NewsRibbon() {
  return (
    <section className="relative mx-auto w-full max-w-7xl px-6 py-5">
      <div className="relative rounded-4xl border border-foreground/10 p-8 md:p-12 bg-white/5 backdrop-blur-xl overflow-visible">
        <h2 className="mb-10 mt-5 text-center text-3xl font-semibold text-primary md:text-4xl">
          Новости компании
        </h2>

        <div className="absolute top-2 right-6 z-10 isolate flex gap-3 md:top-6 md:right-6">
          <button className="news-swiper-button-prev flex h-10 w-10 items-center justify-center rounded-full bg-primary backdrop-blur-xl border border-white/10 text-[oklch(0.141_0.005_285.823)] shadow-lg transition-all hover:bg-white/10 hover:text-primary hover:border-primary">
            ←
          </button>
          <button className="news-swiper-button-next flex h-10 w-10 items-center justify-center rounded-full bg-primary backdrop-blur-xl border border-white/10 text-[oklch(0.141_0.005_285.823)] shadow-lg transition-all hover:bg-white/10 hover:text-primary hover:border-primary">
            →
          </button>
        </div>

        <Swiper
          modules={[Navigation, Autoplay]}
          slidesPerView={1}
          spaceBetween={20}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 24 },
            1280: { slidesPerView: 4, spaceBetween: 24 },
          }}
          navigation={{
            nextEl: ".news-swiper-button-next",
            prevEl: ".news-swiper-button-prev",
          }}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop
        >
          {news.map((item, i) => (
            <SwiperSlide key={i}>
              <article className="group ml-2 mb-15 hover:shadow-2xl hover:shadow-primary/10 h-64 flex flex-col justify-between rounded-3xl border border-transparent bg-black/2 backdrop-blur-2xl p-5 transition-all duration-300 hover:border-primary">
                <div>
                  <time className="mb-2 block text-xs text-foreground/60">
                    {item.date}
                  </time>
                  <h3 className="mb-3 text-base font-semibold text-foreground line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-foreground/70 line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="h-9 bg-none border-primary border text-primary hover:bg-primary hover:text-white hover:text-[oklch(0.141_0.005_285.823)] transition-all"
                >
                  <a href="/novosti">Читать полностью →</a>
                </Button>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
