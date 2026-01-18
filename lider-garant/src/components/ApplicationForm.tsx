"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  URLS,
  VALIDATION_PATTERNS,
  INPUT_CLASSES,
  BUTTON_CLASSES,
} from "@/constants";
import Image from "next/image";
import Link from "next/link";

interface ApplicationFormProps {
  formId: string;
  title?: string;
  description?: string;
  submitText?: string;
  imageSrc?: string;
  imageAlt?: string;
  onSubmit?: (e: React.FormEvent) => void;
}

export default function ApplicationForm({
  formId,
  title = "Подберем самые выгодные предложения",
  description = "Заполните форму, выберите среди предложений банков лучшее, получите гарантию и заключайте контракт с заказчиком.",
  submitText = "Отправить заявку",
  imageSrc = "/good-deal.jpg",
  imageAlt = "good deal",
  onSubmit,
}: ApplicationFormProps) {
  return (
    <section className="mx-auto mt-2 w-full max-w-7xl py-12">
      <div className="grid items-stretch gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            {title}
          </h2>
          <p className="mb-6 text-sm text-foreground/70">{description}</p>
          <form
            id={formId}
            className="space-y-4"
            action="#"
            method="post"
            onSubmit={onSubmit}
          >
            <div className="grid gap-4">
              <Input
                type="text"
                name="inn"
                placeholder="ИНН"
                inputMode="numeric"
                pattern={VALIDATION_PATTERNS.INN.source}
                title="ИНН должен содержать 10 или 12 цифр"
                required
                maxLength={12}
                className={INPUT_CLASSES.ROUNDED_FULL}
              />
              <Input
                type="number"
                name="amount"
                placeholder="Сумма"
                inputMode="numeric"
                min={1}
                step={1000}
                title="Укажите сумму больше 0"
                required
                className={INPUT_CLASSES.ROUNDED_FULL}
              />
              <PhoneInput
                name="phone"
                className={INPUT_CLASSES.ROUNDED_FULL}
                required
              />
            </div>
            <label className="flex items-start gap-3 text-xs text-foreground/70">
              <input
                type="checkbox"
                required
                className="mt-0.5 h-4 w-4 rounded border-foreground/30"
              />
              <span>
                Ставя галочку, я соглашаюсь на обработку персональных данных, в
                соответствии с
                <a
                  href={URLS.AGREEMENT}
                  target="_blank"
                  className="mx-1 underline"
                >
                  Соглашением
                </a>
                и
                <a
                  href={URLS.PRIVACY}
                  target="_blank"
                  className="ml-1 underline"
                >
                  Политикой конфиденциальности
                </a>
                .
              </span>
            </label>
            <Button type="submit" className={BUTTON_CLASSES.SUBMIT}>
              {submitText}
            </Button>
          </form>
        </div>

        <div className="relative h-[320px] md:h-auto w-full rounded-3xl overflow-hidden border border-white/10">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>
      </div>
    </section>
  );
}
