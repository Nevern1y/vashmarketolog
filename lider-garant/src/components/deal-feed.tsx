"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

interface Deal {
  title: string;
  amount: string;
}

export default function DealFeed({ deals }: { deals: Deal[] }) {
  return (
    <Swiper
      modules={[Autoplay]}
      spaceBetween={16}
      slidesPerView={1.2}
      loop={true}
      autoplay={{
        delay: 5500,
        disableOnInteraction: false,
      }}
      breakpoints={{
        640: { slidesPerView: 2.2 },
        1024: { slidesPerView: 3.2 },
      }}
    >
      {deals.map((d, i) => (
        <SwiperSlide key={i} className="pb-5 pt-2 px-2">
          <div className="w-full hover:border-primary/50 rounded-3xl border hover:shadow-lg hover:shadow-primary/20 border-white/10 bg-white/5 p-5 text-sm text-foreground/85 backdrop-blur-md flex h-full min-h-[180px] flex-col transition-all duration-300 hover:-translate-y-1 ">
            <div className="mb-3 text-base font-semibold leading-snug">
              {d.title}
            </div>
            <div className="mb-3 h-px w-full bg-white/10" />
            <div className="mt-auto">
              <div className="text-2xl font-bold text-primary">{d.amount}</div>
              <div className="text-xs text-foreground/60">сумма заявки</div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
