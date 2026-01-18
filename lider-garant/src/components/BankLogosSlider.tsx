"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const banks = Array.from({ length: 16 }, (_, i) => `/logos/${i + 1}.svg`);

export default function BankLogosSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    let animationFrame: number;
    let scrollPos = 0;

    const speed = 3;

    const animate = () => {
      if (!slider) return;

      scrollPos += speed;
      if (scrollPos >= slider.scrollWidth / 3) {
        scrollPos = 0;
      }
      slider.scrollLeft = scrollPos;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const items = [...banks, ...banks, ...banks];

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12">
      <div className="overflow-hidden rounded-4xl border border-foreground/10">
        <div className="px-6 py-8 md:px-12">
          <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
            Наши партнёры
          </h2>

          <div
            ref={sliderRef}
            className="flex gap-6 whitespace-nowrap overflow-x-hidden"
          >
            {items.map((src, i) => (
              <div
                key={i}
                className="flex h-20 min-w-[140px] items-center justify-center rounded-2xl border border-primary/10 bg-primary/5 px-6"
              >
                <Image
                  src={src}
                  alt={`Логотип партнёра ${i + 1}`}
                  width={140}
                  height={48}
                  className="h-12 w-auto object-contain "
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
