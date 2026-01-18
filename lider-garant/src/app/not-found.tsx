"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/FadeIn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";

export default function NotFound() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-20">
      <FadeIn>
        <div className="relative w-full max-w-2xl text-center">
          <div className="relative rounded-[32px] border border-white/10 p-12 text-white ">
            <h1 className="mb-4 text-8xl font-bold text-primary md:text-9xl">
              404
            </h1>
            <h2 className="mb-4 text-2xl font-semibold md:text-3xl">
              Страница не найдена
            </h2>
            <p className="mb-8 text-base text-white/70 md:text-lg">
              К сожалению, запрашиваемая страница не существует или была
              перемещена.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full px-8 btn-three">
                <Link href="/">На главную</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/20 text-white px-8"
                onClick={() => setModalOpen(true)}
              >
                Связаться с нами
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md border-none">
          <DialogHeader>
            <DialogTitle className="text-primary">
              Заказать обратный звонок
            </DialogTitle>
            <DialogDescription>
              Оставьте телефон — перезвоним в течение 15 минут.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                placeholder="Иван Иванович Иванов"
                className="text-white"
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="phone">Телефон</Label>
              <PhoneInput
                id="phone"
                name="phone"
                className="h-11 rounded-full text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setModalOpen(false)}
              className="btn-three w-full"
            >
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
