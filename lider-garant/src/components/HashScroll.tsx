"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToElement = (el: HTMLElement) => {
      // Проверяем поддержку smooth scroll
      if ("scrollBehavior" in document.documentElement.style) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Fallback для старых браузеров
        const targetPosition =
          el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo(0, targetPosition);
      }
    };

    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;

      const id = decodeURIComponent(hash.slice(1));

      const tryScroll = (attempt: number) => {
        const el = document.getElementById(id);
        if (el) {
          scrollToElement(el);
          return;
        }

        if (attempt < 10) {
          window.setTimeout(() => tryScroll(attempt + 1), 100);
        }
      };

      tryScroll(0);
    };

    // Fallback для requestAnimationFrame
    const raf =
      window.requestAnimationFrame ||
      function (cb: FrameRequestCallback) {
        return window.setTimeout(cb, 16);
      };
    const cancelRaf = window.cancelAnimationFrame || window.clearTimeout;

    const raf1 = raf(() => {
      const raf2 = raf(() => {
        scrollToHash();
      });
      return () => cancelRaf(raf2);
    });

    window.addEventListener("hashchange", scrollToHash);

    return () => {
      cancelRaf(raf1);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}
