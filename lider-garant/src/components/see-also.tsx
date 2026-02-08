"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SeeAlsoProps {
  currentPage?: string;
}

export default function SeeAlso({ currentPage }: SeeAlsoProps) {
  const pathname = usePathname();

  const normalizePath = (value?: string) => {
    if (!value) return "";
    const withSlash = value.startsWith("/") ? value : `/${value}`;
    return withSlash !== "/" ? withSlash.replace(/\/$/, "") : withSlash;
  };

  const isSameOrChildPath = (servicePath: string, path: string) => {
    if (!servicePath || !path) return false;
    return path === servicePath || path.startsWith(`${servicePath}/`);
  };

  const allServices = [
    {
      title: "Банковская гарантия",
      desc: "44‑ФЗ, 223‑ФЗ, 185‑ФЗ (615 ПП), коммерческие закупки, налоговые гарантии.",
      href: "/bankovskie-garantii",
      img: "/finance-products/guarantee.png",
      link: "/bankovskie-garantii",
    },
    {
      title: "Кредит для бизнеса",
      desc: "Кредитование для осуществления текущих операционных и иных расходов.",
      href: "/kredity-dlya-biznesa",
      img: "/finance-products/money.png",
      link: "/kredity-dlya-biznesa",
    },
    {
      title: "Страхование СМР",
      desc: "Экспресс страхование крупных контрактов свыше 1млрд рублей.",
      href: "/strahovanie",
      img: "/finance-products/hands.png",
      link: "/strahovanie",
    },
    {
      title: "Международные платежи",
      desc: "Прямые корреспондентские счета в иностранных банках и гарантийные снижение комиссии на конвертацию.",
      href: "/ved",
      img: "/finance-products/money.png",
      link: "/ved",
    },
    {
      title: "Тендерное сопровождение",
      desc: "Каждый 3‑й тендер — победа! Штат опытных специалистов по цене одного сотрудника. ",
      href: "/tendernoe-soprovozhdenie",
      img: "/finance-products/calculator-hand.png",
      link: "/tendernoe-soprovozhdenie",
    },
    {
      title: "Факторинг для бизнеса",
      desc: "Финансирование под уступку денежного требования.",
      href: "/factoring-dlya-biznesa",
      img: "/finance-products/three.png",
      link: "/factoring-dlya-biznesa",
    },
    {
      title: "Лизинг для юрлиц",
      desc: "Финансируем новое и бу с авансом от 0 %",
      href: "/lising-dlya-urlic",
      img: "/finance-products/four.png",
      link: "/lising-dlya-urlic",
    },
  ];

  const currentPath = (() => {
    const candidate = normalizePath(currentPage);
    const candidateMatchesService = allServices.some(
      (service) => normalizePath(service.href) === candidate,
    );

    if (candidate && candidateMatchesService) return candidate;
    return normalizePath(pathname);
  })();

  const related = allServices
    .filter((service) => {
      const servicePath = normalizePath(service.href);
      return !isSameOrChildPath(servicePath, currentPath);
    })
    .slice(0, 6);

  return <SeeAlsoSection related={related} />;
}

interface RelatedItem {
  title: string;
  desc: string;
  href: string;
  img: string;
  link: string;
}

function SeeAlsoSection({ related }: { related: RelatedItem[] }) {
  return (
    <>
      <section className="mx-auto w-full max-w-7xl py-12">
        <h2 className="mb-6 text-4xl font-bold text-primary text-center">
          Смотрите также
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {related.map((item) => (
            <div
              key={item.title}
              className="relative overflow-hidden hover:border-primary/50 hover:shadow-primary/10 flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 px-7 py-7 shadow-[0_0_30px_-15px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-500 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="pr-24 md:pr-32">
                  <h3 className="mb-3 text-xl font-semibold text-primary">
                    {item.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-foreground/75">
                    {item.desc}
                  </p>
                </div>
                {item.img && (
                  <Image
                    src={item.img}
                    alt={item.title}
                    width={240}
                    height={240}
                    sizes="(min-width: 768px) 240px, 192px"
                    className="pointer-events-none absolute bottom-0 right-[-20px] md:right-[-80px] h-48 w-48 md:h-60 md:w-60 object-contain transition-transform duration-300 hover:scale-105"
                  />
                )}
              </div>

              <div className="mt-auto flex items-center justify-between gap-3">
                <Link href={item.link}>
                  <button className="inline-flex rounded-xl border border-primary px-6 py-2.5 text-sm hover:bg-primary font-semibold text-primary transition-all duration-300 hover:-translate-y-1 hover:text-[oklch(0.141_0.005_285.823)] cursor-pointer hover:shadow-md active:translate-y-0 z-50">
                    Узнать больше
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        <h3 className="text-sm text-foreground/70 text-center mt-6">
          Ответим на ваши вопросы с 7:00 до 23:00 по московскому времени
        </h3>
      </section>
    </>
  );
}
