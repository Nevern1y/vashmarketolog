"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("cookieConsent");
  });
  const [isHiding, setIsHiding] = useState(false);

  const hideWithAnimation = (consentType: string) => {
    setIsHiding(true);
    localStorage.setItem("cookieConsent", consentType);
    localStorage.setItem(
      "cookies",
      JSON.stringify({
        necessary: true,
        analytics: consentType === "accepted",
        marketing: consentType === "accepted",
        functional: consentType === "accepted",
      }),
    );

    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const accept = () => {
    hideWithAnimation("accepted");
  };

  const decline = () => {
    hideWithAnimation("declined");
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background border border-primary rounded-lg shadow-lg max-w-xl w-full mx-4 transition-all duration-300 ease-in-out ${
        isHiding
          ? "opacity-0 translate-y-4 scale-95"
          : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg">🍪</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Согласие на использование cookies
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Этот сайт использует файлы cookie, чтобы предоставить вам лучший и
          более удобный опыт просмотра.{" "}
          <Link
            href="/privacy-policy"
            className="text-primary hover:underline underline-offset-2"
          >
            Узнать больше
          </Link>
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={decline}
            className="flex-1 h-10 border-primary text-primary hover:bg-primary hover:text-white hover:text-[oklch(0.141_0.005_285.823)]"
          >
            Отклонить
          </Button>
          <Button onClick={accept} className="flex-1 h-10 btn-three">
            Принять
          </Button>
        </div>
      </div>
    </div>
  );
}
