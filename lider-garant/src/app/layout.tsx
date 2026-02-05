import type { Metadata } from "next";
import { Montserrat, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import HashScroll from "@/components/HashScroll";
import ScrollToTop from "@/components/ScrollToTop";

const fonte = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const font2 = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Лидер гарант | Финансовый маркетплейс",
    template: "%s — Лидер гарант",
  },
  description:
    "Онлайн‑платформа для предпринимателей: банковские гарантии, кредиты, лизинг, факторинг, страхование и другие финансовые продукты.",
  openGraph: {
    type: "website",
    url: "/",
    title: "Лидер гарант | Финансовый маркетплейс",
    description:
      "Сравнение предложений и оформление онлайн: гарантии по 44‑ФЗ/223‑ФЗ, финансирование контрактов, лизинг и др.",
    siteName: "Лидер гарант",
  },
  twitter: {
    card: "summary_large_image",
    title: "Лидер гарант | Финансовый маркетплейс",
    description: "Быстрый подбор финансовых решений для бизнеса и госзакупок.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b12" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${fonte.className} ${font2.className} antialiased`} suppressHydrationWarning>
        <ScrollToTop />
        <HashScroll />
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
