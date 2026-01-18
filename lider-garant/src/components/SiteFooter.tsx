"use client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { Send, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  return (
    <footer className="border-t border-foreground/10 bg-background/80">
      <style>{`
        html[data-theme="light"] .logo-light-footer { display: none; }
        html[data-theme="dark"] .logo-dark-footer { display: none; }
      `}</style>
      <div className="mx-auto w-full max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 -my-18">
              <Image
                src="/logo-light-2.png"
                alt="Логотип"
                width={154}
                height={156}
                className="row-span-2 h-55 w-auto mb-2 logo-light-footer"
              />
              <Image
                src="/logo-dark.png"
                alt="Логотип"
                width={154}
                height={156}
                className="row-span-2 h-15 mb-25 mt-20 w-auto logo-dark-footer"
              />
            </div>
            <address className="not-italic text-sm text-foreground/70 space-y-1">
              <div>ООО Лидер‑Гарант</div>
              <div>129085, г. Москва, Проспект мира 105</div>
            </address>

            <div className="text-sm text-foreground/70 mt-2 space-y-1">
              <div className="font-semibold">Служба поддержки</div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="tel:+79652841415"
                  className="text-primary hover:underline"
                >
                  +7(965)284-14-15
                </a>
                <span>Ежедневно с 7 до 20 Мск</span>
              </div>
              <div>
                <a
                  href={`mailto:${"info@lider-garant.ru"
                    .split("@")
                    .join("&#64;")}`}
                  className="text-primary hover:underline"
                >
                  info@lider-garant.ru
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <ThemeToggle />
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                title="Telegram"
                className="rounded-xl"
              >
                <img src="/tg-logo.webp" alt="" className="w-12 h-12" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                title="VK"
                className=""
              >
                <img
                  src="/vk-logo.webp"
                  alt=""
                  className="w-10 h-10 rounded-xl"
                />
              </a>
            </div>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-primary">
              Маркетплейс
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link
                  href="/bankovskie-garantii"
                  className="nav-link link-gradient"
                >
                  Банковские гарантии
                </Link>
              </li>
              <li>
                <Link
                  href="/kredity-dlya-biznesa"
                  className="nav-link link-gradient"
                >
                  Кредиты для бизнеса
                </Link>
              </li>
              <li>
                <Link
                  href="/factoring-dlya-biznesa"
                  className="nav-link link-gradient"
                >
                  Факторинг для бизнеса
                </Link>
              </li>
              <li>
                <Link href="/deposity" className="nav-link link-gradient">
                  Депозиты
                </Link>
              </li>
              <li>
                <Link href="/ved" className="nav-link link-gradient">
                  Международные платежи
                </Link>
              </li>
              <li>
                <Link
                  href="/lising-dlya-yrlic"
                  className="nav-link link-gradient"
                >
                  Лизинг для юрлиц
                </Link>
              </li>
              <li>
                <Link href="/strahovanie" className="nav-link link-gradient">
                  Страхование СМР
                </Link>
              </li>
              <li>
                <Link href="/rko" className="nav-link link-gradient">
                  РКО и спец счета
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-primary">
              Сервисы
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/novosti" className="nav-link link-gradient">
                  Новости
                </Link>
              </li>
              <li>
                <Link
                  href="/proverka-contragentov"
                  className="nav-link link-gradient"
                >
                  Проверка контрагента
                </Link>
              </li>
              <li>
                <Link
                  href="/tendernoe-soprovojdenie"
                  className="nav-link link-gradient"
                >
                  Тендерное сопровождение
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 text-sm font-semibold text-primary">
              Компания
            </div>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/o-proekte" className="nav-link link-gradient">
                  О компании
                </Link>
              </li>
              <li>
                <Link href="/contact" className="nav-link link-gradient">
                  Контакты
                </Link>
              </li>
              <li>
                <Link href="/sitemap" className="nav-link link-gradient">
                  Карта сайта
                </Link>
              </li>
              <li>
                <Link href="/agents" className="nav-link link-gradient">
                  Агентам
                </Link>
              </li>
              <li>
                <Link href="/seo-manager/login" className="nav-link link-gradient">
                  SEO
                </Link>
              </li>
              <li>
                <Link href="/partneram" className="nav-link link-gradient">
                  Партнерам
                </Link>
              </li>
              <li>
                <Link href="/documenty" className="nav-link link-gradient">
                  Документы
                </Link>
              </li>
              <li>
                <Link
                  href="/vacansii"
                  className={`nav-link link-gradient ${pathname === "/vacancies" ? "active" : ""}`}
                >
                  Вакансии
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-foreground/50">
          © {new Date().getFullYear()} ООО Лидер‑Гарант. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
