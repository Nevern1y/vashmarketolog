import type { ReactNode } from "react";

import FadeIn from "@/components/FadeIn";
import BestOffersSection, { type BestOffer } from "@/components/BestOffersSection";
import ApplicationFormSection from "@/components/ApplicationFormSection";
import SeeAlso from "@/components/see-also";
import ManagerCTASection from "@/components/ManagerCTASection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface SeoTemplatePageProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  bestOffersTitle?: string;
  applicationFormTitle?: string;
  applicationButtonText?: string;
  popularSearches?: Array<{ text: string; href?: string }>;
  offers?: BestOffer[];
  showBestOffers?: boolean;
  showApplicationForm?: boolean;
  showPopularSearches?: boolean;
  showSeeAlso?: boolean;
  showManagerCTA?: boolean;
  children?: ReactNode;
}

export default function SeoTemplatePage({
  title,
  description,
  buttonText = "Оставить заявку",
  buttonHref = "#application",
  bestOffersTitle = "Лучшие предложения",
  applicationFormTitle = "Оставьте заявку",
  applicationButtonText = "Оставить заявку",
  popularSearches = [],
  offers,
  showBestOffers = true,
  showApplicationForm = true,
  showPopularSearches = true,
  showSeeAlso = true,
  showManagerCTA = true,
  children,
}: SeoTemplatePageProps) {
  const cleanTitle = title.trim();

  const normalizeHref = (value?: string) => {
    const href = String(value || "").trim();
    if (!href) return "#application";
    if (href.startsWith("#") || href.startsWith("/") || /^https?:\/\//i.test(href)) {
      return href;
    }
    return `/${href.replace(/^\/+/, "")}`;
  };

  const isExternalHref = (value: string) => /^https?:\/\//i.test(value);

  const resolvedButtonText = buttonText?.trim() || "Оставить заявку";
  const resolvedButtonHref = normalizeHref(buttonHref);
  const resolvedBestOffersTitle =
    bestOffersTitle?.trim() ||
    (cleanTitle ? `Лучшие предложения — ${cleanTitle}` : "Лучшие предложения");
  const resolvedApplicationFormTitle =
    applicationFormTitle?.trim() ||
    (cleanTitle ? `Оставьте заявку — ${cleanTitle}` : "Оставьте заявку");
  const resolvedApplicationButtonText =
    applicationButtonText?.trim() || "Оставить заявку";

  const normalizedPopularSearches = popularSearches
    .map((item) => ({
      text: String(item.text || "").trim(),
      href: normalizeHref(String(item.href || "#application")),
    }))
    .filter((item) => item.text.length > 0);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/2 p-8 md:p-12">
          <div className="relative z-10 space-y-6 text-center">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                <span className="text-foreground">{title}</span>
              </h1>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-foreground/80 md:text-xl">
                {description}
              </p>
            </div>

            <div className="pt-4">
              <Button asChild className="btn-three h-12">
                {isExternalHref(resolvedButtonHref) ? (
                  <a href={resolvedButtonHref} rel="noopener noreferrer">
                    {resolvedButtonText}
                  </a>
                ) : (
                  <Link href={resolvedButtonHref}>{resolvedButtonText}</Link>
                )}
              </Button>
            </div>
          </div>
        </section>
      </FadeIn>

      {children && (
        <FadeIn delay={0.2}>
          <div className="mt-12">{children}</div>
        </FadeIn>
      )}

      {showBestOffers && (
        <FadeIn delay={0.3}>
          <div className="mt-12">
            <BestOffersSection title={resolvedBestOffersTitle} offers={offers} />
          </div>
        </FadeIn>
      )}

      {showApplicationForm && (
        <FadeIn delay={0.4}>
          <div className="mt-12">
            <ApplicationFormSection
              title={resolvedApplicationFormTitle}
              submitButtonText={resolvedApplicationButtonText}
            />
          </div>
        </FadeIn>
      )}

      {showPopularSearches && normalizedPopularSearches.length > 0 && (
        <FadeIn delay={0.5}>
          <section className="mx-auto w-full max-w-7xl py-5">
            <h2 className="mb-6 text-2xl font-bold text-primary md:text-3xl">
              Часто ищут
            </h2>

            <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
              <div className="grid grid-cols-1 gap-y-2 gap-x-6 sm:grid-cols-2 md:grid-cols-3">
                {normalizedPopularSearches.map((item, index) =>
                  isExternalHref(item.href) ? (
                    <a
                      key={`${item.text}-${index}`}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <Link
                      key={`${item.text}-${index}`}
                      href={item.href}
                      className="block text-sm text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                    >
                      {item.text}
                    </Link>
                  ),
                )}
              </div>
            </div>
          </section>
        </FadeIn>
      )}

      {showSeeAlso && (
        <FadeIn delay={0.6}>
          <div className="mt-12">
            <SeeAlso />
          </div>
        </FadeIn>
      )}

      {showManagerCTA && (
        <FadeIn delay={0.7}>
          <div className="mt-12">
            <ManagerCTASection />
          </div>
        </FadeIn>
      )}
    </main>
  );
}
