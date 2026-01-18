"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

type Props = {
  src?: string;
  autoplay?: boolean;
  hoverPlay?: boolean;
  fill?: boolean;
  className?: string;
  hoverTargetId?: string;
};

export default function LottieHero({
  src,
  autoplay = true,
  hoverPlay = false,
  fill = true,
  className,
  hoverTargetId,
}: Props) {
  const [data, setData] = useState<null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  const urls = useMemo(
    () => [
      "https://assets3.lottiefiles.com/packages/lf20_jcikwtux.json",
      "https://assets7.lottiefiles.com/packages/lf20_jtbfg2nb.json",
      "https://assets2.lottiefiles.com/packages/lf20_t24tpvcu.json",
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;
    const fallbackTimer = setTimeout(() => setShowFallback(true), 1200);

    (async () => {
      const candidates: string[] = [];
      if (src) candidates.push(src);
      candidates.push("/animations/hero.json");
      candidates.push(...urls);

      for (const url of candidates) {
        try {
          const ctrl = new AbortController();
          const id = setTimeout(() => ctrl.abort(), 6000);
          const res = await fetch(url, { signal: ctrl.signal });
          clearTimeout(id);
          if (!res.ok) continue;
          const json = await res.json();
          if (!cancelled) {
            setData(json);
            setError(null);
            setShowFallback(false);
            break;
          }
        } catch {
          continue;
        }
      }

      if (!cancelled) setError("unavailable");
    })();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [urls, src]);

  useEffect(() => {
    if (!hoverTargetId) return;
    const el = document.getElementById(hoverTargetId);
    if (!el) return;

    const onEnter = () => lottieRef.current?.play?.();
    const onLeave = () => lottieRef.current?.stop?.();

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [hoverTargetId]);

  if (error && !showFallback) return null;

  return (
    <div
      className={`${fill ? "absolute inset-0" : "h-full w-full"} ${
        className ?? ""
      }`}
      onMouseEnter={() => {
        if (hoverPlay && !hoverTargetId) lottieRef.current?.play?.();
      }}
      onMouseLeave={() => {
        if (hoverPlay && !hoverTargetId) lottieRef.current?.stop?.();
      }}
      style={{ pointerEvents: hoverPlay && !hoverTargetId ? "auto" : "none" }}
    >
      {data ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={data}
          loop
          autoplay={hoverTargetId ? false : autoplay && !hoverPlay}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <div className="absolute inset-0">
          <div className="absolute -left-10 top-6 h-40 w-40 rounded-full opacity-25 blur-2xl bg-primary/50" />
          <div className="absolute right-6 top-10 h-28 w-28 rounded-full opacity-25 blur-2xl animate-pulse bg-primary/40" />
          <div className="absolute bottom-6 left-10 h-32 w-32 rounded-full opacity-25 blur-2xl animate-[pulse_2s_ease-in-out_infinite] bg-primary/40" />
        </div>
      )}
    </div>
  );
}
