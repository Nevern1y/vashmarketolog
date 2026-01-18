import LottieHero from "@/components/LottieHero";
import Link from "next/link";

export default function PageInDevelop() {
  return (
    <main className="px-4">
      <div className="relative mx-auto my-5 max-w-5xl overflow-hidden rounded-3xl bg-white/2 min-h-[360px] md:min-h-[600px] flex flex-col items-center justify-between">
        <div className="z-10 pt-10 text-center max-w-xl">
          <h1 className="text-3xl md:text-4xl font-semibold text-primary mb-4">
            Страница в разработке
          </h1>

          <p className="text-sm md:text-base text-muted-foreground mb-6">
            Мы уже работаем над этим разделом. Скоро здесь появится полезный
            функционал и обновлённый интерфейс.
          </p>

          <p className="text-xs md:text-sm text-muted-foreground mb-8">
            Следите за обновлениями — мы стараемся сделать сервис максимально
            удобным и быстрым для вас.
          </p>
          <button className="learn-more">
            <span className="circle">
              <span className="icon arrow"></span>
            </span>
            <Link href="/" className="button-text">
              На главную
            </Link>
          </button>
        </div>

        <div className="relative w-full h-[220px] md:h-[360px]">
          <LottieHero src="/Login.json" className="absolute inset-0" />
        </div>
      </div>
    </main>
  );
}
