"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitLead } from "@/lib/leads";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CallbackModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, mounted, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitLead({
        name: name.trim(),
        phone,
        source: "website_form",
        form_name: "callback_modal",
        message: "Запрос обратного звонка",
      });

      if (!result.ok) {
        toast.error(result.error || "Ошибка отправки");
        return;
      }

      toast.success("Заявка отправлена! Мы перезвоним вам в ближайшее время.");
      setName("");
      setPhone("");
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка отправки";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 top-100 z-50 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm md:backdrop-blur transition-all ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-[92vw] max-w-sm sm:w-full sm:max-w-md rounded-xl sm:rounded-2xl border border-foreground/15 bg-background p-4 sm:p-6 text-foreground shadow-xl transition-all ${
            open ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Обратный звонок</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-foreground/70 hover:bg-foreground/10"
              aria-label="Закрыть"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30 sm:text-base"
              required
              disabled={isSubmitting}
            />
            <div>
              <label className="sr-only" htmlFor="callback-phone">
                Телефон
              </label>
              <PhoneInput
                id="callback-phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30 sm:text-base"
                required
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 sm:text-base disabled:opacity-50"
            >
              {isSubmitting ? "Отправка..." : "Жду звонка"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
