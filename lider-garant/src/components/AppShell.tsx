"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
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
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSeoManagerRoute =
    pathname?.startsWith("/seo-manager") || pathname?.startsWith("/seoadmin");
  const hideChrome =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    isSeoManagerRoute;

  const handleCallbackSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (callbackName.trim().length < 2) {
      toast.error("Пожалуйста, укажите ваше имя");
      return;
    }

    if (callbackPhone.replace(/\D/g, "").length < 11) {
      toast.error("Пожалуйста, укажите корректный номер телефона");
      return;
    }

    setIsSubmitting(true);

    const result = await submitLead({
      full_name: callbackName.trim(),
      phone: callbackPhone,
      source: "website_form",
      form_name: "app_shell_callback",
      message: "Запрос обратного звонка",
    });

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Заявка отправлена! Мы перезвоним вам в течение 15 минут.");
    setCallbackName("");
    setCallbackPhone("");
    setModalOpen(false);
  };

  if (hideChrome) {
    if (isSeoManagerRoute) {
      return <div className="min-h-dvh flex flex-col bg-background">{children}</div>;
    }

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
          <form onSubmit={handleCallbackSubmit} className="space-y-3">
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
                  value={callbackName}
                  onChange={(event) => setCallbackName(event.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="phone">Телефон</Label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  className="h-11 rounded-full text-white"
                  value={callbackPhone}
                  onChange={(event) => setCallbackPhone(event.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="btn-three w-full" disabled={isSubmitting}>
                {isSubmitting ? "Отправка..." : "Отправить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
