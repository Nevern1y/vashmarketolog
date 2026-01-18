"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

const steps = [
  {
    title: "Пройдите простую регистрацию",
    desc: "Создайте аккаунт за минуту и получите доступ к личному кабинету.",
    image: "/step-1.png",
  },
  {
    title: "Заведите заявку на финансовый продукт",
    desc: "Выберите продукт и заполните короткую форму — это займёт пару минут.",
    image: "/step-2.png",
  },
  {
    title: "Выберите предложение в режиме одного окна",
    desc: "Сравните условия от партнёров и подтвердите лучший вариант онлайн.",
    image: "/step-3.png",
  },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const progressRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);

  const next = useMemo(
    () => () => {
      setFading(true);
      window.setTimeout(() => {
        setActive((idx) => (idx + 1) % steps.length);
        setFading(false);
      }, 180);
    },
    []
  );

  useEffect(() => {
    if (paused) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      next();
    }, 4000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  const handleSelect = (idx: number) => {
    setFading(true);
    window.setTimeout(() => {
      setActive(idx);
      setFading(false);
    }, 150);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      next();
    }, 4000);
  };
  useEffect(() => {
    if (progressRef.current) window.clearInterval(progressRef.current);

    requestAnimationFrame(() => setProgress(0));

    if (paused) return;

    const start = Date.now();
    progressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / 4000) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (progressRef.current) window.clearInterval(progressRef.current);
      }
    }, 50);

    return () => {
      if (progressRef.current) window.clearInterval(progressRef.current);
    };
  }, [active, paused]);

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl border border-foreground/10">
        <div className="relative grid gap-10 sm:gap-12 px-4 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            tabIndex={0}
            className="order-1 lg:order-0"
          >
            <h2 className="mb-6 mt-2 text-3xl font-bold leading-tight text-primary">
              Как это работает?
            </h2>

            <ol className="relative space-y-4 sm:space-y-6">
              {steps.map((step, i) => (
                <li key={i} className="relative pl-10 sm:pl-12">
                  <div className="pointer-events-none absolute left-2 sm:left-3 top-0 h-full w-0.5 sm:w-[3px] -translate-x-1/2">
                    <div className="absolute inset-0 rounded-full bg-white/10" />
                    <div
                      className="absolute left-0 top-0 w-full rounded-full bg-primary"
                      style={{
                        height: `${
                          i < active ? 100 : i === active ? progress : 0
                        }%`,
                        transition:
                          i === active ? "height 100ms linear" : "none",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelect(i)}
                    className="group relative w-full text-left"
                  >
                    <span
                      className={
                        "absolute -left-5 sm:left-[-18px] top-[-18px] flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[10px] sm:text-sm font-semibold shadow-lg transition-all " +
                        (i === active
                          ? "bg-primary text-white"
                          : "bg-white/10 group-hover:bg-white/20 text-primary")
                      }
                    >
                      {i + 1}
                    </span>

                    <div
                      className={
                        (i === active
                          ? "rounded-xl sm:rounded-2xl bg-white/5 p-4 sm:p-5 border border-transparent hover:border-primary hover:shadow-primary/20 shadow-2xl shadow-transparent"
                          : "rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:bg-white/5") +
                        " transition-all border border-transparent hover:border-primary hover:shadow-primary/20 shadow-2xl shadow-transparent"
                      }
                    >
                      <h3
                        className={
                          "mb-1 text-[14px] sm:text-base md:text-lg font-semibold transition-colors " +
                          (i === active
                            ? "text-foreground"
                            : "text-foreground/65 group-hover:text-foreground")
                        }
                      >
                        {step.title}
                      </h3>
                      <p
                        className={
                          i === active
                            ? "text-[12px] sm:text-sm text-foreground/70"
                            : "text-[12px] sm:text-sm text-foreground/40 group-hover:text-foreground/60"
                        }
                      >
                        {step.desc}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div
            className="relative h-[200px] xs:h-[240px] sm:h-[300px] md:h-[470px] order-2 lg:order-0"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="absolute inset-0 rounded-[20px] sm:rounded-[30px] border border-foreground/10 bg-white/5 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.7)]" />

            <div className="relative h-full overflow-hidden rounded-[20px] sm:rounded-[30px] border border-foreground/10 bg-white/5">
              <div
                className="h-full w-full transition-opacity duration-300 flex items-center justify-center"
                style={{ opacity: fading ? 0 : 1 }}
              >
                <Image
                  src={steps[active].image}
                  alt={steps[active].title}
                  fill
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="absolute bottom-4 left-4 flex items-center gap-2 sm:gap-3 rounded-full bg-black/40 px-3 sm:px-4 py-1.5 sm:py-2 text-white shadow-lg backdrop-blur-xl">
                <Image
                  src="/logos/40.png"
                  alt="Банк"
                  width={28}
                  height={28}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                />
                <Image
                  src="/logos/2.svg"
                  alt="Банк"
                  width={28}
                  height={28}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                />
                <Image
                  src="/logos/41.jpg"
                  alt="Банк"
                  width={28}
                  height={28}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover"
                />
                <span className="ml-1 text-[11px] sm:text-sm font-medium text-white/80">
                  +47
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
