"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  service: z.string().trim().min(1, "Выберите услугу"),
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  phone: z
    .string()
    .regex(
      /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/,
      "Введите корректный номер телефона"
    ),
  email: z.string().email("Введите корректный email"),
  message: z.string().min(10, "Сообщение должно содержать минимум 10 символов"),
  personalData: z
    .boolean()
    .refine(
      (val) => val === true,
      "Необходимо согласие на обработку персональных данных"
    ),
  newsletter: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

const services = [
  "Тендерное сопровождение",
  "Подбор тендеров",
  "Подготовка документации",
  "Банковские гарантии",
  "Юридическое сопровождение",
  "Финансирование контрактов",
];

export default function TenderSupportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: "",
      name: "",
      phone: "",
      email: "",
      message: "",
      personalData: false,
      newsletter: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Form data:", data);

      toast.success(
        "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время."
      );

      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Произошла ошибка при отправке формы. Попробуйте еще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="tender-support-form"
      className="mx-auto w-full max-w-7xl py-12"
    >
      <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-6 md:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="rounded-3xl border border-foreground/10 bg-white/5 p-6 backdrop-blur-md shadow-[0_15px_35px_-25px_rgba(15,23,42,0.35)] md:p-8">
            <h3 className="text-2xl font-bold text-foreground md:text-3xl">
              Актуально в любой ситуации
            </h3>

            <div className="mt-6 space-y-4">
              {[
                "Хотите заработать на закупках, но не знаете как",
                "Был негативный опыт участия и вам нужна помощь",
                "Активно участвуете, но хочется повысить эффективность",
              ].map((text) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/80 md:text-base">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative mt-8 hidden h-[220px] overflow-hidden rounded-2xl md:block">
              <Image
                src="/vacansies/close-up-individual-working-laptop.jpg"
                alt=""
                fill
                className="object-cover object-center"
                sizes="(min-width: 1024px) 520px, (min-width: 768px) 640px, 100vw"
                priority
              />
            </div>
          </div>

          <div className="rounded-3xl border border-foreground/10 bg-background/90 p-6 backdrop-blur-md shadow-[0_20px_50px_-35px_rgba(15,23,42,0.55)] md:p-8">
            <h2 className="mb-6 text-center text-2xl font-bold text-foreground md:text-3xl">
              Форма обратной связи
            </h2>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Услуга</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-xl bg-background/60 border-foreground/15 text-foreground focus-visible:border-primary/60 focus-visible:ring-primary/30 focus-visible:ring-[3px]">
                            <SelectValue placeholder="Тендерное сопровождение" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">ФИО</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Иванов Иван Иванович"
                          className="h-11"
                          {...field}
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
                      <FormLabel className="sr-only">Телефон</FormLabel>
                      <FormControl>
                        <PhoneInput className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ivanov@email.ru"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Сообщение</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Подберите мне закупки в отрасли: ..."
                          className="min-h-[110px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="personalData"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs font-normal text-foreground/70 md:text-sm">
                            Я даю согласие на обработку моих персональных данных
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newsletter"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-xs font-normal text-foreground/70 md:text-sm">
                            Я согласен получать новости, рассылки и звонки от
                            Лидер гарант
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-2xl btn-three"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Получить консультацию"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
