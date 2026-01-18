import FadeIn from "@/components/FadeIn";
import BestOffersSection from "@/components/BestOffersSection";
import ApplicationFormSection from "@/components/ApplicationFormSection";
import SeeAlso from "@/components/see-also";
import ManagerCTASection from "@/components/ManagerCTASection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TemplatePageProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  backgroundImage?: string;
  showBestOffers?: boolean;
  showApplicationForm?: boolean;
  showSeeAlso?: boolean;
  showManagerCTA?: boolean;
  children?: React.ReactNode;
}

export default function TemplatePage({
  title = "Шаблонный текст",
  description = "Шаблонный текст",
  buttonText = "Шаблонный текст",
  buttonHref = "#application",
  showBestOffers = true,
  showApplicationForm = true,
  showSeeAlso = true,
  showManagerCTA = true,
  children,
}: TemplatePageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/2 p-8 md:p-12">
          <div className="relative z-10 text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                <span className="text-foreground">{title}</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                {description}
              </p>
            </div>

            <div className="pt-4">
              <Button asChild className="h-12 btn-three">
                <Link href={buttonHref}>{buttonText}</Link>
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
            <BestOffersSection />
          </div>
        </FadeIn>
      )}

      {showApplicationForm && (
        <FadeIn delay={0.4}>
          <div className="mt-12">
            <ApplicationFormSection />
          </div>
        </FadeIn>
      )}

      {showSeeAlso && (
        <FadeIn delay={0.5}>
          <div className="mt-12">
            <SeeAlso />
          </div>
        </FadeIn>
      )}

      {showManagerCTA && (
        <FadeIn delay={0.6}>
          <div className="mt-12">
            <ManagerCTASection />
          </div>
        </FadeIn>
      )}
    </main>
  );
}
