"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;

      const id = decodeURIComponent(hash.slice(1));

      const tryScroll = (attempt: number) => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        if (attempt < 10) {
          window.setTimeout(() => tryScroll(attempt + 1), 100);
        }
      };

      tryScroll(0);
    };

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        scrollToHash();
      });
      return () => cancelAnimationFrame(raf2);
    });

    window.addEventListener("hashchange", scrollToHash);

    return () => {
      cancelAnimationFrame(raf1);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}
