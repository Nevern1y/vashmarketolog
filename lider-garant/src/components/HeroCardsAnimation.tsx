"use client";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const prng = (seed: number) => {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const FullAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(
    () => [
      { key: "intro", durationMs: 2600 },
      { key: "checks", durationMs: 5600 },
      { key: "offer", durationMs: 3800 },
    ],
    [],
  );

  useEffect(() => {
    const duration = steps[currentStep]?.durationMs ?? 3000;
    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentStep, steps]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5 },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const formVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 80,
        damping: 15,
      },
    },
  };

  const checks = useMemo(
    () => [
      { title: "Проверяем ИНН", subtitle: "ФНС и открытые реестры" },
      { title: "Оцениваем кредитный профиль", subtitle: "Скоринг и риски" },
      { title: "Сравниваем банки", subtitle: "Подбираем лучшие условия" },
    ],
    [],
  );

  const particles = useMemo(
    () =>
      [...Array(15)].map((_, i) => {
        const seed = 1337 + i * 97;
        const dx = prng(seed + 1) * 80 - 40;
        const dy = prng(seed + 2) * 80 - 40;
        const duration = prng(seed + 3) * 4 + 3;
        const delay = prng(seed + 4) * 2;
        const left = `${prng(seed + 5) * 100}%`;
        const top = `${prng(seed + 6) * 100}%`;

        return { dx, dy, duration, delay, left, top };
      }),
    [],
  );

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-[#3ce8d1]/20 backdrop-blur-sm bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="absolute inset-0">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#3ce8d1]/30 rounded-full"
            animate={{
              x: [0, p.dx],
              y: [0, p.dy],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
            style={{
              left: p.left,
              top: p.top,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Application Form */}
        {currentStep === 0 && (
          <motion.div
            key="form"
            className="relative h-full w-full flex flex-col items-center justify-center px-4 md:px-8 py-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              variants={formVariants}
              className="relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-2xl w-full max-w-md"
            >
              <div className="flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="relative"
                >
                  <img
                    src="/logo-dark.png"
                    alt="Lider Garant"
                    className="w-36 sm:w-40 h-auto max-h-24 object-contain"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{ opacity: [0.05, 0.25, 0.05] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ boxShadow: "0 0 40px rgba(60, 232, 209, 0.25)" }}
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-5 text-center"
              >
                <div className="text-white text-lg sm:text-xl md:text-2xl font-bold">
                  Подбираем банковское предложение
                </div>
                <div className="text-white/70 text-sm sm:text-base mt-1">
                  Запускаем проверку и скоринг за несколько секунд
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {currentStep === 1 && (
          <motion.div
            key="processing"
            className="flex flex-col items-center justify-start h-full px-4 sm:px-8 py-5 sm:py-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              variants={itemVariants}
              className="w-full max-w-xl h-full flex flex-col"
            >
              <div className="text-center">
                <motion.h2
                  className="text-xl sm:text-2xl md:text-3xl font-bold text-white"
                  variants={itemVariants}
                >
                  Идут проверки
                </motion.h2>
                <motion.p
                  className="text-white/70 text-sm sm:text-base md:text-lg mt-2"
                  variants={itemVariants}
                >
                  Обрабатываем данные и запрашиваем условия у банков
                </motion.p>
              </div>

              <div className="mt-4 sm:mt-6 space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                {checks.map((c, idx) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.45, duration: 0.5 }}
                    className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-xl px-3 sm:px-4 py-3 flex items-center gap-3"
                  >
                    <motion.div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(60, 232, 209, 0.0)",
                          "0 0 16px rgba(60, 232, 209, 0.35)",
                          "0 0 0px rgba(60, 232, 209, 0.0)",
                        ],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: idx * 0.2,
                      }}
                      style={{ background: "rgba(60, 232, 209, 0.12)" }}
                    >
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[#3ce8d1]"
                        animate={{ scale: [1, 1.6, 1] }}
                        transition={{
                          duration: 1.4,
                          repeat: Infinity,
                          delay: idx * 0.2,
                        }}
                      />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">
                        {c.title}
                      </div>
                      <div className="text-white/60 text-xs sm:text-sm truncate">
                        {c.subtitle}
                      </div>
                    </div>

                    <motion.div
                      className="h-1.5 w-16 sm:w-20 rounded-full bg-white/10 overflow-hidden"
                      initial={false}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            "linear-gradient(90deg, #3ce8d1, #008ed6)",
                        }}
                        animate={{ width: ["0%", "100%"] }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          repeatDelay: 0.8,
                          ease: "easeInOut",
                          delay: idx * 0.2,
                        }}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {currentStep === 2 && (
          <motion.div
            key="results"
            className="flex flex-col items-center justify-start h-full px-4 sm:px-8 py-5 sm:py-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              variants={itemVariants}
              className="w-full max-w-xl h-full flex flex-col"
            >
              <div className="text-center shrink-0">
                <motion.div
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 relative"
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ffd93d] to-[#ffb800] rounded-full opacity-20 blur-xl"></div>
                  <div className="absolute inset-2 bg-gradient-to-r from-[#ffd93d] to-[#ffb800] rounded-full opacity-40 blur-lg"></div>
                  <div className="absolute inset-4 bg-gradient-to-r from-[#ffd93d] to-[#ffb800] rounded-full flex items-center justify-center">
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white"
                    >
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </motion.div>

                <motion.h2
                  className="text-2xl sm:text-3xl md:text-4xl font-bold text-white"
                  variants={itemVariants}
                >
                  Предложение готово
                </motion.h2>

                <motion.p
                  className="text-[#3ce8d1] text-base sm:text-lg md:text-xl mt-2"
                  variants={itemVariants}
                >
                  Получили варианты от банков и выбрали лучшее
                </motion.p>
              </div>

              <motion.div
                variants={itemVariants}
                className="mt-4 sm:mt-6 bg-gradient-to-r from-[#3ce8d1]/20 to-[#008ed6]/20 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-[#3ce8d1]/30 flex-1 min-h-0 overflow-y-auto"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <img
                      src="/logo.svg"
                      alt="Lider Garant"
                      className="w-12 h-12 sm:w-14 sm:h-14"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-lg md:text-xl truncate">
                      Банк-партнёр одобрил лимит
                    </div>
                    <div className="text-white/75 mt-1">
                      До{" "}
                      <span className="text-white font-semibold">
                        5 000 000 ₽
                      </span>{" "}
                      • от{" "}
                      <span className="text-white font-semibold">14.9%</span>
                    </div>
                    <div className="text-white/60 text-sm mt-2">
                      Ответ за 2 минуты, без лишних документов
                    </div>
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                      <span className="text-[#ffd93d] text-sm font-semibold">
                        ★ 4.9
                      </span>
                      <span className="text-white/60 text-sm">
                        • 1000+ довольных клиентов
                      </span>
                      <span className="text-white/60 text-sm">
                        • 15+ банков
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
