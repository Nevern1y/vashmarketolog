"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import FadeIn from "@/components/FadeIn";
import { BANK_GUARANTEE_TYPE_OPTIONS, submitLead } from "@/lib/leads";

export default function GuaranteeCalculator() {
  const [guaranteeType, setGuaranteeType] = useState<string>(
    BANK_GUARANTEE_TYPE_OPTIONS[0].value,
  );
  const [amount, setAmount] = useState(1000000);
  const [months, setMonths] = useState(10);
  const [discount, setDiscount] = useState(true);
  const [phoneKey, setPhoneKey] = useState(0);

  type FormValues = {
    fullname: string;
    phone: string;
    consent: boolean;
  };

  const form = useForm<FormValues>({
    defaultValues: {
      fullname: "",
      phone: "",
      consent: true,
    },
    mode: "onSubmit",
  });
  const isSubmitting = form.formState.isSubmitting;

  const formatNumber = (num: number) => {
    return num.toLocaleString("ru-RU");
  };

  const calculatePrice = () => {
    const basePrice = amount * months * 0.0012;
    const finalPrice = discount ? basePrice * 0.8 : basePrice;
    return Math.round(finalPrice);
  };

  const originalPrice = Math.round((amount * months * 0.0012) / 100);
  const finalPrice = calculatePrice();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setAmount(Math.min(Math.max(value, 10000), 1000000000));
  };

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setMonths(Math.min(Math.max(value, 1), 120));
  };

  const onSubmit = async (values: FormValues) => {
    const result = await submitLead({
      full_name: values.fullname.trim(),
      phone: values.phone,
      product_type: "bank_guarantee",
      guarantee_type: guaranteeType,
      amount,
      term_months: months,
      source: "website_calculator",
      form_name: "guarantee_calculator",
      message: discount ? "Запрошен расчет со скидкой" : undefined,
    });

    if (!result.ok) {
      toast.error(result.error || "Произошла ошибка при отправке заявки");
      return;
    }

    form.reset();
    setPhoneKey((k) => k + 1);

    toast.success("Заявка отправлена");
  };

  return (
    <FadeIn>
      <section className="mx-auto w-full max-w-7xl px-4 md:p-12 bg-white/5 rounded-xl md:rounded-2xl my-10">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="mb-2 text-2xl md:text-3xl font-bold text-primary">
                Рассчитайте стоимость банковской гарантии (БГ)
              </h2>
              <p className="text-xs md:text-sm">Выберите тип гарантии</p>
            </div>

            <div className="flex flex-wrap gap-2 md:gap-3">
              {BANK_GUARANTEE_TYPE_OPTIONS.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setGuaranteeType(type.value)}
                  className={`rounded-lg md:rounded-xl px-2 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-semibold transition-all hover:-translate-y-1 cursor-pointer
                    ${
                      guaranteeType === type.value
                        ? "border-2 border-teal-400 bg-teal-400 text-[oklch(0.141_0.005_285.823)]"
                        : "border-2 border-teal-400 text-teal-600 bg-transparent"
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <Label className="text-sm md:text-base font-medium text-primary">
                Сумма гарантии, ₽
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={formatNumber(amount)}
                  onChange={(e) => {
                    const value =
                      parseInt(e.target.value.replace(/\s/g, "")) || 0;
                    setAmount(Math.min(Math.max(value, 10000), 1000000000));
                  }}
                  className="h-12 md:h-16 text-lg md:text-2xl font-bold text-gray-900 bg-white border-gray-300 px-4 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>
              <input
                type="range"
                min="10000"
                max="1000000000"
                step="10000"
                value={amount}
                onChange={handleAmountChange}
                className="
      w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-400
      [&::-webkit-slider-thumb]:appearance-none
      [&::-webkit-slider-thumb]:h-5
      [&::-webkit-slider-thumb]:w-5
      [&::-webkit-slider-thumb]:rounded-full
      [&::-webkit-slider-thumb]:bg-teal-400
      [&::-webkit-slider-thumb]:cursor-pointer
      [&::-moz-range-thumb]:h-5
      [&::-moz-range-thumb]:w-5
      [&::-moz-range-thumb]:rounded-full
      [&::-moz-range-thumb]:bg-teal-400
      [&::-moz-range-thumb]:border-0
      [&::-moz-range-thumb]:cursor-pointer
    "
                style={{
                  background: `linear-gradient(to right, var(--teal, #14b8a6) 0%, var(--teal, #14b8a6) ${
                    ((amount - 10000) / (1000000000 - 10000)) * 100
                  }%, #e5e7eb ${
                    ((amount - 10000) / (1000000000 - 10000)) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />

              <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                <span className="text-xs">10 тыс</span>
                <span className="hidden sm:inline text-xs">1 млн</span>
                <span className="hidden md:inline text-xs">100 млн</span>
                <span className="text-xs">1 млрд</span>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm md:text-base font-medium text-primary">
                Срок, месяцев
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={months}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setMonths(Math.min(Math.max(value, 1), 120));
                  }}
                  className="h-12 md:h-16 text-lg md:text-2xl font-bold text-gray-900 bg-white border-gray-300 px-4 pr-12"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                step="1"
                value={months}
                onChange={handleMonthsChange}
                className="
      w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-400
      [&::-webkit-slider-thumb]:appearance-none
      [&::-webkit-slider-thumb]:h-5
      [&::-webkit-slider-thumb]:w-5
      [&::-webkit-slider-thumb]:rounded-full
      [&::-webkit-slider-thumb]:bg-teal-400
      [&::-webkit-slider-thumb]:cursor-pointer
      [&::-moz-range-thumb]:h-5
      [&::-moz-range-thumb]:w-5
      [&::-moz-range-thumb]:rounded-full
      [&::-moz-range-thumb]:bg-teal-400
      [&::-moz-range-thumb]:border-0
      [&::-moz-range-thumb]:cursor-pointer
    "
                style={{
                  background: `linear-gradient(to right, var(--teal, #14b8a6) 0%, var(--teal, #14b8a6) ${
                    ((months - 1) / (120 - 1)) * 100
                  }%, #e5e7eb ${
                    ((months - 1) / (120 - 1)) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />

              <div className="flex justify-between text-xs text-gray-500">
                <span>от 1 мес.</span>
                <span>до 120 мес.</span>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 p-5 md:p-8 shadow-xl">
              <div className="mb-6 space-y-2 md:space-y-3 border-b border-gray-200 pb-6">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="">Сумма гарантии:</span>
                  <span className="font-semibold text-primary">
                    {amount >= 1000000
                      ? `${(amount / 1000000).toFixed(1)} млн ₽`
                      : `${formatNumber(amount)} ₽`}
                  </span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="">Срок:</span>
                  <span className="font-semibold text-primary">
                    {months}{" "}
                    {months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-2 text-xs md:text-sm">Итоговая цена:</div>
                <div className="flex items-baseline gap-2 md:gap-3">
                  <span className="text-2xl md:text-3xl font-bold text-primary">
                    {formatNumber(finalPrice)} ₽
                  </span>
                  {discount && (
                    <span className="text-sm md:text-lg text-red-500 line-through">
                      {formatNumber(originalPrice)} ₽
                    </span>
                  )}
                </div>
              </div>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="ФИО"
                    {...form.register("fullname", {
                      required: true,
                      onChange: (e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.replace(/\d/g, "");
                      },
                    })}
                    className="bg-white text-black border-gray-300 px-4 py-3 md:py-6 text-sm md:text-base"
                    required
                  />
                </div>

                <div className="space-y-2">
                  {/* Phone input styled as rectangular input like others */}
                  <Controller
                    name="phone"
                    control={form.control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <PhoneInput
                        key={phoneKey}
                        placeholder="+7 (___) ___-__-__"
                        value={field.value}
                        onChange={field.onChange}
                        className="bg-white border-gray-300 px-4 py-3 md:py-6 text-sm md:text-base text-black"
                        required
                      />
                    )}
                  />
                </div>

                {/* Discount row with sliding toggle */}
                <div
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-teal-50 p-3 md:p-4"
                  role="group"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Custom sliding switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={discount}
                      onClick={() => setDiscount((s) => !s)}
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none
                        ${discount ? "bg-teal-400" : "bg-gray-200"}`}
                    >
                      <span
                        className={`absolute left-1 h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200
                          ${discount ? "translate-x-6" : "translate-x-0"}`}
                      />
                    </button>

                    <Label className="text-xs md:text-sm font-medium text-black cursor-pointer">
                      Скидка
                    </Label>
                  </div>

                  {discount && (
                    <span className="rounded bg-red-500 px-2 md:px-3 py-0.5 md:py-1 text-xs font-bold text-white">
                      -20%
                    </span>
                  )}
                </div>

                <Label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    required
                    className="h-5 w-5 rounded border border-gray-300 accent-primary focus:ring-2 focus:ring-primary/30"
                    {...form.register("consent", { required: true })}
                  />
                  <span className="text-xs md:text-sm ml-2">
                    Я даю согласие на обработку{" "}
                    <span className="font-medium text-primary">
                      персональных данных
                    </span>
                  </span>
                </Label>

                <Button
                  type="submit"
                  className="w-full h-11 md:h-14 bg-primary btn-three text-sm md:text-base"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Отправить"}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  * Предварительный расчет
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
