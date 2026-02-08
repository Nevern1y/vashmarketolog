"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Smartphone, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import CustomSelect from "./ui/my-select";
import { toast } from "sonner";

const financeItems = [
  { label: "Банковские гарантии", href: "/bankovskie-garantii" },
  { label: "Кредиты для бизнеса", href: "/kredity-dlya-biznesa" },
  { label: "Лизинг для юрлиц", href: "/lising-dlya-urlic" },
  { label: "Факторинг для бизнеса", href: "/factoring-dlya-biznesa" },
  { label: "Страхование СМР", href: "/strahovanie" },
  { label: "Международные платежи", href: "/ved" },
  { label: "РКО и спецсчета", href: "/rko" },
  { label: "Депозиты", href: "/deposity" },
];

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Пожалуйста, введите ваше имя")
    .regex(/^[^0-9]*$/, "Имя не должно содержать цифры")
    .min(2, "Имя должно содержать минимум 2 символа"),
  phone: z
    .string()
    .min(1, "Пожалуйста, введите номер телефона")
    .regex(/^[+]?[\d\s\-\(\)]+$/, "Неверный формат телефона")
    .refine(
      (phone) => phone.replace(/\D/g, "").length >= 11,
      "Номер телефона должен содержать минимум 11 цифр",
    ),
});

type FormData = z.infer<typeof formSchema>;

interface HeaderProps {
  onOpenCallModal?: () => void;
}

export default function Header({ onOpenCallModal }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const phoneValue = watch("phone");

  const onSubmit = (data: FormData) => {
    toast.success("Заявка отправлена! Мы перезвоним вам в течение 15 минут.");
    console.log("Form submitted:", data);
    reset();
    setModalOpen(false);
  };

  return (
    <>
      <style>{`
        html[data-theme="light"] .logo-light {
          display: none;
        }
        html[data-theme="dark"] .logo-dark {
          display: none;
        }
      `}</style>
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur py-5">
        <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-6 md:px-8 whitespace-nowrap">
          <Link
            href="/"
            className="grid grid-cols-[auto_1fr] items-center gap-x-3"
          >
            <Image
              src="/logo-light-2.png"
              alt="Логотип"
              width={154}
              height={156}
              className="row-span-2 h-55 w-auto mb-2 logo-light"
            />
            <Image
              src="/logo-dark.png"
              alt="Логотип"
              width={160}
              height={160}
              className="logo-dark  w-auto h-15 object-contain transition-all"
              priority
            />
          </Link>
          <nav className="mt-1 hidden items-center justify-center gap-6 min-[1260px]:flex lg:gap-8">
            <CustomSelect items={financeItems} />

            <Link href="/agents" className="nav-link link-gradient">
              Агентам
            </Link>
            <Link href="/partneram" className="nav-link link-gradient">
              Партнерам
            </Link>
            <Link href="/o-proekte" className="nav-link link-gradient">
              О проекте
            </Link>
          </nav>
          <div className="hidden shrink-0 items-center gap-4 md:flex md:gap-6">
            <div className="">
              <Smartphone className="h-5 w-5 text-foreground" />
            </div>

            <div className="flex flex-col items-start leading-tight">
              <a
                href="tel:+79652841415"
                className="text-[15px] font-semibold text-foreground hover:opacity-80 transition"
              >
                +7(965)284-14-15
              </a>
              <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogTrigger asChild>
                  <button className="text-xs font-medium text-brand nav-link link-gradient">
                    Обратный звонок
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-none">
                  <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                      <DialogTitle className="text-primary">
                        Заказать обратный звонок
                      </DialogTitle>
                      <DialogDescription>
                        Оставьте телефон — перезвоним в течение 15 минут.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                      <div className="grid gap-1">
                        <Label htmlFor="name">Имя</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Иван Иванович Иванов"
                          className="text-white bg-background/80 border-white/20"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-400">
                            {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="phone">Телефон</Label>
                        <PhoneInput
                          id="phone"
                          value={phoneValue}
                          onChange={(e) => setValue("phone", e.target.value)}
                          placeholder="+7 (___) ___-__-__"
                          className="h-11 bg-background/80 border-white/20 text-white "
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-400">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="btn-three w-full">
                        Отправить
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Link
              href="https://lk.lider-garant.ru/"
              className="btn-three py-2 px-6 font-semibold"
            >
              Личный кабинет
            </Link>
          </div>

          <button
            aria-label="Открыть меню"
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-foreground/10 min-[1260px]:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="p-0 w-[92vw] max-w-sm">
            <VisuallyHidden>
              <SheetTitle>Меню навигации</SheetTitle>
            </VisuallyHidden>
            <div className="flex h-dvh flex-col overflow-y-auto bg-background p-5">
              <div className="mb-4 flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2"
                >
                  <Image src="/logo.svg" alt="Логотип" width={80} height={20} />
                  <span className="text-base font-semibold">Лидер гарант</span>
                </Link>
                <button
                  aria-label="Закрыть меню"
                  className="rounded-lg p-2 hover:bg-foreground/10"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="mb-2 text-xs uppercase text-foreground/60">
                    Финансовые продукты
                  </div>
                  <ul className="space-y-2">
                    {financeItems.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="block rounded-lg px-3 py-2 text-foreground hover:bg-foreground/10"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <nav className="grid gap-2">
                  <Link
                    href="/agents"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 hover:bg-foreground/10"
                  >
                    Агентам
                  </Link>
                  <Link
                    href="/partneram"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 hover:bg-foreground/10"
                  >
                    Партнерам
                  </Link>
                  <Link
                    href="/o-proekte"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 hover:bg-foreground/10"
                  >
                    О проекте
                  </Link>
                </nav>

                <div className="grid gap-4 rounded-2xl border border-foreground/10 bg-foreground/5 p-5 shadow-sm backdrop-blur-md dark:bg-white/5 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <a
                        href="tel:+79652841415"
                        className="text-lg font-semibold tracking-tight text-primary whitespace-nowrap"
                      >
                        +7(965)284-14-15
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-3 justify-between">
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onOpenCallModal?.();
                      }}
                      className="text-sm font-medium text-primary underline underline-offset-4"
                    >
                      Обратный звонок
                    </button>
                    <div className="rounded-xl bg-foreground/15 p-1.5 text-foreground shadow-sm dark:bg-black/50">
                      <ThemeToggle />
                    </div>
                  </div>
                  <Link
                    href="https://lk.lider-garant.ru/"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 font-semibold text-[oklch(0.141_0.005_285.823)] shadow-sm transition hover:shadow-md"
                  >
                    Личный кабинет
                  </Link>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
