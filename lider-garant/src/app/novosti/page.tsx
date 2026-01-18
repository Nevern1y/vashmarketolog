import FadeIn from "@/components/FadeIn";

const news = [
  {
    title: "Обновление условий банковских гарантий",
    date: "15.11.2025",
    excerpt: "Снижение ставок и упрощённый скоринг для малого бизнеса.",
    content:
      "Мы рады сообщить об обновлении условий по банковским гарантиям. Теперь ставки снижены на 15%, а процесс скоринга для малого бизнеса стал значительно проще. Новые условия действуют для всех типов гарантий: 44-ФЗ, 223-ФЗ, коммерческие и налоговые гарантии. Обработка заявок занимает не более 2 часов.",
  },
  {
    title: "Новый партнёр по лизингу",
    date: "10.11.2025",
    excerpt: "Запущены программы с авансом от 0% и ускоренным одобрением.",
    content:
      "Подключили нового крупного партнёра по лизингу, что позволило запустить уникальные программы финансирования. Аванс от 0%, ускоренное одобрение за 1 час, а также специальные условия для транспорта с пробегом. Теперь доступны лизинговые программы для всех видов транспорта и оборудования.",
  },
  {
    title: "ВЭД: прямые коррсчета",
    date: "05.11.2025",
    excerpt: "Подключили ещё два иностранных банка для удобных платежей.",
    content:
      "Расширили географию банковских партнёров для внешнеэкономической деятельности. Подключили банки в Китае и ОАЭ, что позволяет проводить платежи в юанях и дирхамах напрямую. Комиссии снижены на 20%, а скорость обработки международных платежей увеличена в 3 раза.",
  },
  {
    title: "Страхование контрактов",
    date: "01.11.2025",
    excerpt: "Экспресс-полисы для контрактов свыше 30 млн руб.",
    content:
      "Запустили новую программу экспресс-страхования крупных контрактов. Теперь полисы для контрактов свыше 30 млн рублей оформляются за 15 минут. Покрытие включает все основные риски, а премии снижены на 10%. Доступно онлайн-оформление и моментальная доставка полиса.",
  },
];

export default function NewsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 md:py-16">
      <FadeIn>
        <h1 className="text-4xl md:text-5xl text-center font-bold tracking-tight mb-12">
          <span className="text-primary ">Новости</span>
        </h1>
      </FadeIn>

      <div className="grid gap-8">
        {news.map((item, index) => (
          <FadeIn key={index} delay={index * 0.1}>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <div className="mb-4">
                <time className="text-sm text-foreground/60 mb-2 block">
                  {item.date}
                </time>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
                  {item.title}
                </h2>
                <p className="text-lg text-foreground/80 leading-relaxed mb-6">
                  {item.excerpt}
                </p>
              </div>

              <div className="border-t border-white/10 pt-6">
                <p className="text-foreground/70 leading-relaxed">
                  {item.content}
                </p>
              </div>
            </article>
          </FadeIn>
        ))}
      </div>
    </main>
  );
}
