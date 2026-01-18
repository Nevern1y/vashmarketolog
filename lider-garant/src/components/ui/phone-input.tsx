"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

type Props = React.ComponentProps<typeof Input> & {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatByDigits(digits: string) {
  // normalize: remove leading 7 or 8 if present
  if (digits.startsWith("8")) digits = digits.slice(1);
  if (digits.startsWith("7")) digits = digits.slice(1);
  digits = digits.slice(0, 10);

  const a = digits.slice(0, 3);
  const b = digits.slice(3, 6);
  const c = digits.slice(6, 8);
  const d = digits.slice(8, 10);

  let out = "+7";
  if (a.length) out += `(${a}`;
  if (a.length === 3) out += `)`;
  if (b.length) out += b;
  if (b.length === 3 && c.length) out += `-${c}`;
  if (d.length) out += `-${d}`;

  return out;
}

const PHONE_PATTERN = "\\+7\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}";

const PhoneInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, className, ...props }, ref) => {
    const [inner, setInner] = React.useState(() => {
      if (!value) return "";
      const digits = onlyDigits(value);
      return formatByDigits(digits);
    });

    React.useEffect(() => {
      if (value === undefined) return;
      const digits = onlyDigits(value);
      const formatted = formatByDigits(digits);
      setInner(formatted);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = onlyDigits(e.target.value);
      const formatted = formatByDigits(digits);
      setInner(formatted);

      const synthetic = {
        ...e,
        target: { ...e.target, value: formatted },
      } as React.ChangeEvent<HTMLInputElement>;

      if (onChange) onChange(synthetic);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const el = e.target as HTMLInputElement;
      const digits = onlyDigits(el.value);

      if (digits.length > 0 && digits.length !== 11) {
        el.setCustomValidity("Введите номер в формате +7(XXX)XXX-XX-XX");
      } else {
        el.setCustomValidity("");
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={inner}
        onChange={handleChange}
        onBlur={handleBlur}
        inputMode="tel"
        pattern={PHONE_PATTERN}
        placeholder="+7 (___) ___-__-__"
        maxLength={20}
        className={className}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
