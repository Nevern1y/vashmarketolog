"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BANK_GUARANTEE_TYPE_OPTIONS,
  PRODUCT_TYPE_MAP,
  submitLead,
} from "@/lib/leads";

const formSchema = z
  .object({
    product: z.string().min(1, "Выберите продукт"),
    guaranteeType: z.string().optional(),
    name: z
      .string()
      .min(1, "Введите имя")
      .min(2, "Имя должно содержать минимум 2 символа")
      .regex(/^[а-яёa-z\s]+$/i, "Имя должно содержать только буквы"),
    phone: z
      .string()
      .min(1, "Введите телефон")
      .regex(
        /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/,
        "Введите корректный номер телефона",
      )
      .refine((phone) => phone.replace(/\D/g, "").length === 11, {
        message: "Введите корректный номер телефона",
      }),
    inn: z
      .string()
      .min(1, "Введите ИНН")
      .regex(/^\d{10}$|^\d{12}$/, "ИНН должен содержать 10 или 12 цифр"),
    amount: z
      .string()
      .min(1, "Укажите сумму")
      .refine((amount) => {
        const num = Number(amount.replace(/\s/g, ""));
        return !isNaN(num) && num > 0;
      }, "Укажите сумму больше 0"),
  })
  .superRefine((values, ctx) => {
    if (values.product === "Банковская гарантия" && !values.guaranteeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guaranteeType"],
        message: "Выберите тип гарантии",
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface ApplicationFormSectionProps {
  title?: string;
  submitButtonText?: string;
}

export default function ApplicationFormSection({
  title = "Оставьте заявку",
  submitButtonText = "Оставить заявку",
}: ApplicationFormSectionProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "Кредиты",
      guaranteeType: "",
      name: "",
      phone: "",
      inn: "",
      amount: "",
    },
    mode: "onChange",
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedProduct = form.watch("product");

  const onSubmit = async (values: FormValues) => {
    const amountNum = Number(values.amount.replace(/\s/g, ""));
    const productType = PRODUCT_TYPE_MAP[values.product];

    if (!productType) {
      toast.error("Не удалось определить выбранный продукт");
      return;
    }

    const result = await submitLead({
      full_name: values.name.trim(),
      phone: values.phone,
      inn: values.inn,
      amount: amountNum,
      product_type: productType,
      guarantee_type:
        productType === "bank_guarantee" ? values.guaranteeType : undefined,
      source: "website_form",
      form_name: "application_form_section",
    });

    if (!result.ok) {
      toast.error(result.error || "Произошла ошибка при отправке заявки");
      return;
    }

    toast.success("Заявка отправлена", {
      description: `${values.name}, ${
        values.product
      } — ${amountNum.toLocaleString("ru-RU")} ₽`,
    });

    form.reset();
  };

  const products = [
    "Кредиты",
    "Банковская гарантия",
    "ВЭД",
    "Лизинг",
    "Страхование",
    "Тендерное сопровождение",
  ];

  return (
    <section id="application" className="mx-auto w-full max-w-7xl py-5">
      <div className="relative overflow-hidden rounded-[32px] border border-foreground/10">
        <div className="relative grid items-center gap-10 px-6 py-10 md:px-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="mb-6 text-3xl font-semibold leading-tight text-primary md:text-[40px]">
              {title}
            </h3>
            <div className="mb-6 flex flex-wrap gap-3">
              {products.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    form.setValue("product", p);
                    if (p !== "Банковская гарантия") {
                      form.setValue("guaranteeType", "");
                      form.clearErrors("guaranteeType");
                    }
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all border ${
                    selectedProduct === p
                      ? "bg-primary text-[oklch(0.141_0.005_285.823)] border-transparent shadow-[0_20px_45px_-25px_rgba(16,185,129,1)]"
                      : "bg-none text-primary border-primary hover:bg-primary hover:text-[oklch(0.141_0.005_285.823)] transition-all"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {selectedProduct === "Банковская гарантия" && (
                  <FormField
                    control={form.control}
                    name="guaranteeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Тип гарантии
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-full border border-foreground/10 bg-white/10 px-4 text-foreground focus:ring-foreground/40">
                              <SelectValue placeholder="Выберите тип гарантии" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BANK_GUARANTEE_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Имя
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ваше имя"
                            {...field}
                            className="h-12 rounded-full border border-foreground/10 bg-white/10 px-4 text-foreground placeholder:text-foreground/40 focus-visible:ring-foreground/40"
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^а-яёa-z\s]/gi,
                                "",
                              );
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Телефон
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="+7 (___) ___-__-__"
                            {...field}
                            className="h-12 rounded-full border border-foreground/10 bg-white/10 px-4 text-foreground placeholder:text-foreground/40 focus-visible:ring-foreground/40"
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "");

                              let formatted = "+7";
                              if (digits.length > 1)
                                formatted += ` (${digits.slice(1, 4)}`;
                              if (digits.length >= 4)
                                formatted += `) ${digits.slice(4, 7)}`;
                              if (digits.length >= 7)
                                formatted += `-${digits.slice(7, 9)}`;
                              if (digits.length >= 9)
                                formatted += `-${digits.slice(9, 11)}`;

                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          ИНН
                        </FormLabel>
                        <FormControl>
                          <Input
                            inputMode="numeric"
                            placeholder="Введите ИНН"
                            maxLength={12}
                            {...field}
                            className="h-12 rounded-full border border-foreground/10 bg-white/10 px-4 text-foreground placeholder:text-foreground/40 focus-visible:ring-foreground/40"
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                          Сумма
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Сумма"
                            {...field}
                            className="h-12 rounded-full border border-foreground/10 bg-white/10 px-4 text-foreground placeholder:text-foreground/40 focus-visible:ring-foreground/40"
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^\d]/g, "");
                              const formatted = raw.replace(
                                /\B(?=(\d{3})+(?!\d))/g,
                                " ",
                              );
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col items-start gap-4">
                  <Button
                    type="submit"
                    className="h-12 btn-three px-6 text-sm font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Отправка..." : submitButtonText}
                  </Button>
                  <p className="text-xs text-foreground/70">
                    Находим только самые лучшие предложения, в которых сами
                    уверены
                  </p>
                </div>
              </form>
            </Form>
          </div>

          <div className="relative hidden min-h-[220px] overflow-hidden rounded-[26px] border border-white/10 bg-white/5 lg:block">
            <Image
              src="/zayavka.jpg"
              alt="Заявка"
              fill
              sizes="(min-width: 1024px) 50vw, 0"
              className="object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-slate-900/30 to-slate-950/60" />
          </div>
        </div>
      </div>
    </section>
  );
}
