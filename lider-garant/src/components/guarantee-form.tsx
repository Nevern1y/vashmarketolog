"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Компонент полностью на TailwindCSS.
// Замените пути к изображениям на свои (heroImage и логотипы).

export default function GuaranteeHeroSection() {
  const [type, setType] = useState("Участие в тендере");

  const guaranteeOptions = [
    "Участие в тендере",
    "Исполнение контракта",
    "Аванс",
    "Гарантийные обязательства",
    "Открытые / закрытые",
    "Коммерческие",
  ];

  return (
    <section className="relative mx-auto my-12 w-full max-w-7xl px-6">
      {/* Большой бэкграунд-панель */}
      <div className="rounded-[28px] bg-[#f5f7fb] p-8 shadow-sm">
        <div className="relative flex items-center gap-8 overflow-visible isolate">
          {/* Левой блок: логотипы в плашках */}
          <div className="relative hidden w-1/3 flex-col items-start gap-6 md:flex z-10">
            <div className="transform -translate-x-8">
              <LogoPill
                imgSrc="/images/logo-vtb.svg"
                name="ВТБ Банк"
                note="Заявка успешно одобрена"
              />
            </div>

            <div className="transform -translate-x-12">
              <LogoPill
                imgSrc="/images/logo-gpb.svg"
                name="Газпромбанк"
                note="Заявка успешно одобрена"
              />
            </div>

            <div className="transform -translate-x-16">
              <LogoPill
                imgSrc="/images/logo-uralsib.svg"
                name="Уралсиб"
                note="Заявка успешно одобрена"
              />
            </div>
          </div>

          <div className="flex w-full justify-center md:justify-start z-0">
            <div className="relative w-[420px] shrink-0">
              <Image
                src="/images/hero-person.png"
                alt="hero"
                width={420}
                height={560}
                className="pointer-events-none select-none"
              />
            </div>
          </div>

          <div className="absolute right-0 top-1/2 w-full max-w-[520px] -translate-y-1/2 md:relative md:mr-0 md:ml-auto z-20">
            <div className="mx-auto w-full rounded-2xl bg-white p-8 shadow-[0_14px_30px_rgba(35,45,65,0.08)] md:ml-8">
              <h3 className="mb-6 text-2xl font-extrabold text-slate-800">
                Получить банковскую гарантию
              </h3>

              <div className="space-y-4">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left text-slate-600"
                  >
                    <span>{type}</span>
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 placeholder:text-slate-400"
                  placeholder="Иванов Иван Иванович"
                />

                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-4 placeholder:text-slate-400"
                  placeholder="+7 (___) ___-__-__"
                />

                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary"
                    />
                    <span className="text-sm text-slate-600">
                      Я даю согласие на обработку моих{" "}
                      <span className="font-medium text-slate-800">
                        персональных данных
                      </span>
                    </span>
                  </label>

                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary"
                    />
                    <span className="text-sm text-slate-600">
                      Я согласен получать{" "}
                      <span className="font-medium text-slate-800">
                        новости, рассылки и звонки
                      </span>{" "}
                      от Группы ВБЦ
                    </span>
                  </label>
                </div>

                <button className="mt-4 w-full rounded-2xl bg-gradient-to-br from-[#a99ef6] to-[#9fb4ff] px-6 py-4 text-lg font-semibold text-white shadow-md">
                  Отправить заявку
                </button>
              </div>

              {/* небольшой список опций (dropdown) - скрытым текстом, чтобы визуально соответствовать макету */}
              <div className="mt-4 hidden">
                {guaranteeOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setType(opt)}
                    className="block w-full text-left py-2"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoPill({
  imgSrc,
  name,
  note,
}: {
  imgSrc: string;
  name: string;
  note: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-full bg-white px-5 py-3 shadow-sm">
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
        <img src={imgSrc} alt={name} className="h-full w-full object-contain" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800">{name}</div>
        <div className="text-xs text-green-600">{note}</div>
      </div>
    </div>
  );
}
