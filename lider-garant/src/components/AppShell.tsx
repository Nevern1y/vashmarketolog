"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";
import ContactMultiButton from "@/components/ContactMultiButton";
import CookieConsent from "@/components/CookieConsent";
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
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const hideChrome =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (hideChrome) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <div className="mx-auto w-full max-w-7xl px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>На главную</span>
          </Link>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <>
      <Header onOpenCallModal={() => setModalOpen(true)} />
      {children}
      <SiteFooter />
      <ContactMultiButton onOpenCallModal={() => setModalOpen(true)} />
      <CookieConsent />

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
    </>
  );
}
