import Link from "next/link";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
          Документы
        </h1>

        <p className="text-lg md:text-xl text-foreground mb-8 max-w-2xl mx-auto">
          Ознакомьтесь с нашей политикой конфиденциальности, чтобы понять, как
          мы собираем, используем и защищаем ваши персональные данные.
        </p>

        <Link
          href="/политика-конфиденциальности.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="learn-more inline-flex items-center text-base font-medium transition-all"
        >
          <div className="circle">
            <div className="icon arrow"></div>
          </div>
          <div className="button-text">Открыть </div>
        </Link>
      </div>
    </div>
  );
}
