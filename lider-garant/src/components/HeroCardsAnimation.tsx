"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Particles } from "./Particles";

const applicationData = {
  inn: "",
  amount: "",
  status: "ready",
};

export const FullAnimation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(applicationData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const stepDurations = [4000, 3000, 3000];

    const timer = setTimeout(() => {
      if (currentStep === 1) {
        setIsSubmitting(true);
        setTimeout(() => {
          setIsSubmitting(false);
          setShowResult(true);
          setTimeout(() => {
            setCurrentStep(2);
          }, 2000);
        }, 2000);
      } else if (currentStep < 2) {
        setCurrentStep((prevStep) => (prevStep + 1) % 3);
      }
    }, stepDurations[currentStep]);

    return () => clearTimeout(timer);
  }, [currentStep]);

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

  const resultVariants = {
    hidden: { x: 50, opacity: 0, scale: 0.8 },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border border-[#3ce8d1]/20 backdrop-blur-sm bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        <Particles />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Application Form */}
        {currentStep === 0 && (
          <motion.div
            key="form"
            className="relative h-full w-full flex flex-col items-center justify-center px-4 md:px-8 py-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Form Card */}
            <motion.div
              variants={formVariants}
              className="relative bg-slate-800/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-2xl w-full max-w-md"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">
                    ИНН
                  </label>
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <input
                      type="text"
                      placeholder="Введите ИНН"
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3ce8d1]"
                    />
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-medium">
                    Сумма
                  </label>
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                  >
                    <input
                      type="text"
                      placeholder="Введите сумму"
                      className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3ce8d1]"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div
              className="my-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
            >
              <motion.svg
                className="w-8 h-12 mx-auto text-[#3ce8d1]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1.2, duration: 1.0 }}
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </motion.svg>
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="relative"
            >
              <img
                src="/logo-dark.png"
                alt="Lider Garant"
                className="w-32 h-auto max-h-20 object-contain"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Step 2: Processing */}
        {currentStep === 1 && (
          <motion.div
            key="processing"
            className="flex flex-col items-center justify-center h-full px-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants} className="text-center">
              <motion.div
                className="w-20 h-20 mx-auto mb-6 relative"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#3ce8d1] to-[#008ed6] rounded-full opacity-20 blur-xl"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-[#3ce8d1] to-[#008ed6] rounded-full opacity-40 blur-lg"></div>
                <div className="absolute inset-4 bg-gradient-to-r from-[#3ce8d1] to-[#008ed6] rounded-full flex items-center justify-center">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-white"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      fill="currentColor"
                      opacity="0.8"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.6"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.8"
                    />
                  </svg>
                </div>
              </motion.div>

              <motion.h2
                className="text-2xl md:text-3xl font-bold text-white mb-4"
                variants={itemVariants}
              >
                Обработка заявки
              </motion.h2>

              <motion.p
                className="text-[#3ce8d1]/80 text-lg"
                variants={itemVariants}
              >
                Анализируем данные и подбираем лучшие предложения
              </motion.p>

              <motion.div className="mt-6 flex gap-2">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-[#3ce8d1] rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Step 3: Results */}
        {currentStep === 2 && (
          <motion.div
            key="results"
            className="flex flex-col items-center justify-center h-full px-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants} className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-6 relative"
                variants={itemVariants}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffd93d] to-[#ffb800] rounded-full opacity-20 blur-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffd93d] to-[#ffb800] rounded-full flex items-center justify-center">
                  <svg
                    width="48"
                    height="48"
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
                className="text-3xl md:text-4xl font-bold text-white mb-4"
                variants={itemVariants}
              >
                Готово!
              </motion.h2>

              <motion.p
                className="text-[#3ce8d1] text-xl mb-8"
                variants={itemVariants}
              >
                Найдено 15 банковских предложений для вас
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="bg-gradient-to-r from-[#3ce8d1]/20 to-[#008ed6]/20 backdrop-blur-sm rounded-2xl p-6 border border-[#3ce8d1]/30"
              >
                <div className="flex items-center gap-4">
                  <img
                    src="/logo.svg"
                    alt="Lider Garant"
                    className="w-16 h-16"
                  />
                  <div className="text-left">
                    <h3 className="text-white font-bold text-xl">
                      Lider Garant
                    </h3>
                    <p className="text-white/80">
                      Ваш надежный финансовый партнер
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[#ffd93d] text-sm font-semibold">
                        ★ 4.9
                      </span>
                      <span className="text-white/60 text-sm">
                        • 1000+ довольных клиентов
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
