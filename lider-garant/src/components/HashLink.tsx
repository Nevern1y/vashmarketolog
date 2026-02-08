"use client";

import { MouseEvent, ReactNode } from "react";

interface HashLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function HashLink({ href, className, children }: HashLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;

    const id = href.slice(1);
    const el = document.getElementById(id);

    if (el) {
      e.preventDefault();

      // Обновляем URL
      if (window.history && window.history.pushState) {
        window.history.pushState(null, "", href);
      } else {
        window.location.hash = href;
      }

      // Скролим к элементу (fallback для старых браузеров)
      if ("scrollBehavior" in document.documentElement.style) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        const targetPosition =
          el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo(0, targetPosition);
      }
    }
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
