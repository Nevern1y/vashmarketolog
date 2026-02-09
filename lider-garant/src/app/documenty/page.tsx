"use client";

import { FileText, FileCheck } from "lucide-react";
import FadeIn from "@/components/FadeIn";

const documents = [
  {
    title: "Пользовательское соглашение",
    description: "Правила использования сервиса и условия предоставления услуг",
    href: "/Пользовательское соглашение (2).docx",
    Icon: FileText,
    gradient: "from-indigo-500/5 via-transparent to-sky-500/5",
  },
  {
    title: "Политика обработки персональных данных",
    description:
      "Информация о сборе, использовании и защите ваших персональных данных",
    href: "/Политика обработки персональных данных (1).docx",
    Icon: FileCheck,
    gradient: "from-sky-500/5 via-transparent to-emerald-500/5",
  },
];

export default function DocumentsPage() {
  const openDocument = (docPath: string) => {
    const absoluteFileUrl = `${window.location.origin}${docPath}`;
    const viewerUrl =
      `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(absoluteFileUrl)}`;

    const popup = window.open(viewerUrl, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.href = viewerUrl;
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16 space-y-12">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-8 md:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-primary/70">
              Правовая информация
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
              <span className="text-primary">Документы</span>
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Ознакомьтесь с нашими документами, чтобы понять правила
              использования сервиса и политику обработки персональных данных.
            </p>
          </div>
        </section>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        {documents.map((doc, index) => (
          <FadeIn key={index} delay={0.1 * (index + 1)}>
            <button
              onClick={() => openDocument(doc.href)}
              className={`group relative block w-full text-left overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br ${doc.gradient} p-6 transition-all hover:border-primary/30 cursor-pointer`}
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <doc.Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {doc.title}
                  </h2>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {doc.description}
                  </p>
                  <span className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-primary">
                    Открыть документ
                    <svg
                      className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          </FadeIn>
        ))}
      </div>
    </main>
  );
}
