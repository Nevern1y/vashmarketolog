"use client";

import { useEffect, useState } from "react";
import { PhoneInput } from "@/components/ui/phone-input";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CallbackModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

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
            >
              ✕
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="space-y-3"
          >
            <input
              type="text"
              placeholder="Ваше имя"
              className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30 sm:text-base"
              required
            />
            <div>
              <label className="sr-only" htmlFor="callback-phone">
                Телефон
              </label>
              <PhoneInput
                id="callback-phone"
                name="phone"
                className="w-full rounded-xl border border-foreground/15 bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30 sm:text-base"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 sm:text-base"
            >
              Жду звонка
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
