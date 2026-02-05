import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import type { ReactNode } from "react";

export type FaqItem = {
  q: string;
  a: string | string[] | ReactNode;
};

type Props = {
  title: string;
  items: FaqItem[];
  sectionClassName?: string;
  titleClassName?: string;
  children?: ReactNode;
};

export default function FaqSection({
  title,
  items,
  sectionClassName = "mx-auto w-full max-w-7xl px-0 py-10 md:py-14",
  titleClassName = "mb-6 text-2xl font-bold text-primary md:text-3xl text-center",
  children,
}: Props) {
  return (
    <section className={sectionClassName}>
      <h2 className={titleClassName}>{title}</h2>

      <Accordion type="single" collapsible className="space-y-3">
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="overflow-hidden rounded-2xl border border-foreground/10 bg-white/5 px-4 shadow-xl transition-all hover:border-primary/50 hover:shadow-[0_0_24px_rgba(34,211,238,0.25)] data-[state=open]:border-primary data-[state=open]:shadow-[0_0_24px_rgba(34,211,238,0.25)]"
          >
            <AccordionTrigger className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-foreground/90 transition-colors [&[data-state=open]>svg]:rotate-180">
              {item.q}
              <svg
                className="h-4 w-4 shrink-0 transition-transform duration-300"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </AccordionTrigger>

            <AccordionContent className="overflow-hidden pb-4 text-sm text-foreground/70 transition-all duration-300 data-[state=closed]:opacity-0 data-[state=closed]:max-h-0 data-[state=open]:opacity-100 data-[state=open]:max-h-40">
              {Array.isArray(item.a)
                ? item.a.map((line, idx) => <p key={idx}>{line}</p>)
                : item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {children}
    </section>
  );
}
