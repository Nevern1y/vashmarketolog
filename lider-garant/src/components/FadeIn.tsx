"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  threshold?: number;
  delay?: number;
  className?: string;
};

export default function FadeIn({ children, threshold = 0.15, delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer: IntersectionObserver | null = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay) {
              const t = setTimeout(() => setVisible(true), delay);
              return () => clearTimeout(t);
            }
            setVisible(true);
          }
        });
      },
      { threshold }
    );
    observer.observe(el);
    return () => {
      observer && observer.disconnect();
    };
  }, [threshold, delay]);

  return (
    <div
      ref={ref}
      className={
        `${className} transition-opacity duration-700 ease-out will-change-[opacity] ` +
        (visible ? "opacity-100" : "opacity-0")
      }
    >
      {children}
    </div>
  );
}
