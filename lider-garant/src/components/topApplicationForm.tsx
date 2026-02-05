"use client";

import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { submitLead, GUARANTEE_TYPE_MAP } from "@/lib/leads";

const banks = [
  { name: "ВТБ Банк", logo: "/logos/22.svg", width: 44, height: 44 },
  { name: "Газпромбанк", logo: "/logos/19.svg", width: 44, height: 44 },
  { name: "Уралсиб", logo: "/logos/9.svg", width: 48, height: 44 },
];

const formSchema = z.object({
  guaranteeType: z.string().min(1, "Выберите тип гарантии"),
  fullname: z
    .string()
    .min(2, "ФИО должно содержать минимум 2 символа")
    .regex(/^[а-яА-ЯёЁ\s]+$/, "ФИО должно содержать только русские буквы"),
  phone: z
    .string()
    .min(1, "Введите номер телефона")
    .regex(
      /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/,
      "Введите корректный номер телефона"
    ),
  consent: z
    .boolean()
    .refine(
      (val) => val === true,
      "Необходимо дать согласие на обработку персональных данных"
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function TopApplicationForm() {
  const [phoneKey, setPhoneKey] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guaranteeType: "",
      fullname: "",
      phone: "",
      consent: true,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const result = await submitLead({
      full_name: data.fullname.trim(),
      phone: data.phone,
      product_type: "bank_guarantee",
      guarantee_type:
        GUARANTEE_TYPE_MAP[data.guaranteeType] || "application_security",
      source: "landing_page",
      form_name: "top_application_form",
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время."
    );

    reset();
    setPhoneKey((k) => k + 1);
  };

  return (
    <FadeIn>
      <section className="relative mx-auto mt-6 md:mt-8 w-full max-w-7xl bg-white/5 overflow-visible rounded-2xl md:rounded-3xl px-4 md:px-6 lg:px-12 py-6 md:py-10 min-h-auto md:min-h-[550px] border border-foreground/10">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-4 md:gap-8 lg:gap-12 h-full min-h-auto lg:min-h-[500px]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 flex-1">
            <div className="flex flex-col gap-3 md:gap-4 w-full lg:w-auto z-20">
              {banks.map((bank, index) => (
                <div
                  key={bank.name}
                  className="group relative flex items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl border border-gray-200 bg-white px-3 md:px-5 py-3 md:py-4 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01] min-w-full md:min-w-[320px] lg:min-w-[380px]"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex h-10 md:h-12 w-10 md:w-12 shrink-0 items-center justify-center rounded-lg md:rounded-xl bg-white">
                    <Image
                      src={bank.logo}
                      alt={bank.name}
                      width={bank.width}
                      height={bank.height}
                      className="object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="mt-1 md:mt-1.5 flex items-center gap-1.5 md:gap-2 text-xs md:text-xs text-gray-600">
                      <CheckCircle2
                        className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0 text-emerald-500"
                        strokeWidth={2.5}
                      />
                      <span className="truncate md:truncate">
                        Заявка одобрена
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block shrink-0 absolute z-20 left-5">
              <Image
                src="/application-form-women.png"
                alt="woman"
                width={450}
                height={550}
                className="h-auto w-auto max-h-[550px] object-contain"
                priority
              />
            </div>
          </div>

          <div className="flex shrink-0 w-full lg:w-auto">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full max-w-lg lg:max-w-xl rounded-2xl md:rounded-3xl border border-foreground/20 bg-white/5 p-5 md:p-10 lg:p-12 shadow-2xl relative mt-4 md:-mt-8 lg:-mt-12 md:-mb-8 lg:-mb-12"
              aria-label="Форма получения банковской гарантии"
            >
              <h3 className="mb-1 text-xl md:text-2xl font-bold leading-tight text-primary">
                Получение банковской гарантии
              </h3>
              <p className="mb-4 text-xs md:text-sm text-foreground/70">
                Оставьте запрос на получение БГ
              </p>

              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="guaranteeType" className="text-xs md:text-sm">
                  Вид гарантии
                </Label>
                <Controller
                  name="guaranteeType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        className={`w-full bg-white border-gray-300 px-4 py-2.5 md:py-6 text-sm text-black rounded-md ${
                          errors.guaranteeType ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tender">
                          Участие в тендере
                        </SelectItem>
                        <SelectItem value="contract">
                          Исполнение контракта
                        </SelectItem>
                        <SelectItem value="warranty">
                          Исполнение гарантийных обязательств
                        </SelectItem>
                        <SelectItem value="advance">Возврат аванса</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.guaranteeType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.guaranteeType.message}
                  </p>
                )}
              </div>

              <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
                <Label htmlFor="fullname" className="text-xs md:text-sm">
                  ФИО
                </Label>
                <Input
                  id="fullname"
                  type="text"
                  placeholder="ФИО"
                  className={`bg-white border-gray-300 px-4 py-2.5 md:py-6 text-sm md:text-base rounded-md ${
                    errors.fullname ? "border-red-500" : ""
                  }`}
                  {...register("fullname", {
                    onChange: (e) => {
                      const value = e.target.value.replace(/[0-9]/g, "");
                      e.target.value = value;
                    },
                  })}
                />
                {errors.fullname && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fullname.message}
                  </p>
                )}
              </div>

              <div className="mt-2 md:mt-3 space-y-2 md:space-y-3">
                <Label htmlFor="phone" className="text-xs md:text-sm">
                  Телефон
                </Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      key={phoneKey}
                      id="phone"
                      className={`bg-white border-gray-300 px-4 py-2.5 md:py-6 text-sm md:text-base rounded-md ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                <Controller
                  name="consent"
                  control={control}
                  render={({ field }) => (
                    <Label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5 rounded border border-gray-300 accent-primary focus:ring-2 focus:ring-primary/30 mt-0.5"
                      />
                      <span className="text-xs md:text-sm ml-2">
                        Я даю согласие на обработку{" "}
                        <span className="font-medium text-primary">
                          персональных данных
                        </span>
                      </span>
                    </Label>
                  )}
                />
                {errors.consent && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.consent.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="mt-4 btn-three h-12 w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправка..." : "Получить БГ"}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
