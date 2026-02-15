"use client";

import FadeIn from "@/components/FadeIn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";

const formSchema = z.object({
  organization: z.string().min(2, "Введите название банка/организации"),
  fullName: z.string().min(2, "Введите ФИО"),
  email: z.string().email("Введите корректный email"),
  phone: z
    .string()
    .min(1, "Введите номер телефона")
    .regex(
      /^\+7[\s(]?\d{3}[\s)]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/,
      "Введите корректный номер телефона",
    ),
  comments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const advantages = [
  {
    title: "Проверяем клиентов",
    description:
      "Система самостоятельно проверит клиентов, которые подходят под условия вашего продукта.",
  },
  {
    title: "Личный кабинет",
    description:
      "Вы получаете доступ для управления сделками Lider-Garant с индивидуальными настройками прав доступа.",
  },
  {
    title: "Анализ продуктов",
    description:
      "Помогаем доработать или разработать конкурентный продукт и вывести его на рынок.",
  },
  {
    title: "Оценка финансового состояния клиента",
    description:
      "Оцениваем финансовое состояние по параметрам скоринга банка и готовим сведения для присвоения категории заемщика по методике банка.",
  },
  {
    title: "Интеграция системы по API",
    description: "Полноценная интеграция по API с Вашей внутренней системой.",
  },
];

const mission = [
  "В лице Лидер-Гарант вы найдете надежного партнера и помощь в развитии продуктов и бизнес процессов для достижении общих целей",
  "Платформа Lider-Garant позволяет банкам работать с агентами и агрегаторами по привлечению клиентов на банковские продукты в сегменте малого и среднего бизнеса.",
];

const platform = [
  "1. Все виды гарантий и различных видов закупок: совместной, закрытой, многолодовой и закупки у единственного поставщика;",
  "2. Кредитов в любой форме: с единовременной выдачей, возобновляемых и невозобновляемых кредитных линий.",
];

export default function Page() {
  const [modalOpen, setModalOpen] = useState(false);
  const partnerInputClassName =
    "bg-background/80 border-white/20 text-white placeholder:text-white/50";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: "",
      fullName: "",
      email: "",
      phone: "",
      comments: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const messageParts = [`Организация: ${data.organization.trim()}`];
      const comment = data.comments?.trim();

      if (comment) {
        messageParts.push(`Комментарий: ${comment}`);
      }

      const result = await submitLead({
        full_name: data.fullName.trim(),
        phone: data.phone,
        email: data.email.trim(),
        source: "website_form",
        form_name: "partners_modal",
        message: messageParts.join("\n"),
      });

      if (!result.ok) {
        toast.error(result.error || "Произошла ошибка при отправке заявки.");
        return;
      }

      toast.success(
        "Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.",
      );

      reset();
      setModalOpen(false);
    } catch {
      toast.error("Произошла ошибка при отправке заявки. Попробуйте еще раз.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16 space-y-12">
      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
            Приглашаем банки, страховые и лизинговые компании, а также другие
            финансовые институты к сотрудничеству
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-4xl">
            Присоединитесь в маркетплейсу Лидер-Гарант для получения стабильного
            потока клиентов
          </h1>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="mt-6 h-12 rounded-full px-8 bg-primary text-sm font-medium text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                Оставить заявку
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-none max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle className="text-primary text-xl">
                    Стать партнером
                  </DialogTitle>
                  <DialogDescription>
                    Заполните форму, и мы свяжемся с вами для обсуждения условий
                    сотрудничества.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="organization">Банк/Организация *</Label>
                    <Input
                      id="organization"
                      {...register("organization")}
                      placeholder="ООО 'Название банка'"
                      className={partnerInputClassName}
                    />
                    {errors.organization && (
                      <p className="text-sm text-red-400">
                        {errors.organization.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">ФИО *</Label>
                    <Input
                      id="fullName"
                      {...register("fullName")}
                      placeholder="Иванов Иван Иванович"
                      className={partnerInputClassName}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-400">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="example@bank.ru"
                      className={partnerInputClassName}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          id="phone"
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="+7 (___) ___-__-__"
                          className={`h-11 ${partnerInputClassName}`}
                        />
                      )}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-400">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="comments">Комментарии</Label>
                    <Textarea
                      id="comments"
                      {...register("comments")}
                      placeholder="Опишите вашу компанию и интересующие условия сотрудничества..."
                      className={`min-h-[100px] resize-none ${partnerInputClassName}`}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="flex-1"
                  >
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 btn-three"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Отправка..." : "Отправить заявку"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-primary">
            Преимущества работы
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-foreground/80 transition-all hover:border-primary hover:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
              >
                <p className="text-base font-semibold text-primary">
                  {item.title}
                </p>
                <p className="mt-3">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-primary">
            Наша задача - связать Банки с Клиентами по всей стране, для быстрого
            и удобного получения банковских продуктов
          </h2>
          <div className="mt-6 space-y-4 text-sm text-foreground/80">
            {mission.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="text-2xl font-semibold text-primary">
            Платформа разработана с учетом:
          </h2>
          <div className="mt-5 space-y-3 text-sm text-foreground/80">
            {platform.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-xl font-semibold text-primary">
                Хотите стать партнером?
              </h3>
              <p className="mt-2 text-sm text-foreground/70">
                Оставьте заявку на сотрудничество — мы свяжемся с вами и обсудим
                условия интеграции и поток клиентов.
              </p>
            </div>
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button className="h-12 btn-three whitespace-nowrap">
                  Стать партнером
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
