import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export function GuaranteeSection() {
  const features = [
    {
      title: "Минимальные риски отказов – всего 0,01%",
      description:
        "Обеспечиваем высокую степень надёжности в обработке платежей и имеем 7 не связанных с Россией иностранных компаний",
    },
    {
      title: "Юридическая безопасность",
      description:
        "Подписываем полный и понятный договор, который учитывает все детали нашего сотрудничества",
    },
    {
      title: "Безопасный валютный контроль",
      description:
        "Наши платежи без проблем проходят валютный контроль, так как мы соблюдаем все требования и тщательно проверяем документацию",
    },
    {
      title: "Гарантированное поступление средств",
      description:
        "Мы обеспечиваем зачисление перевода вашему контрагенту за счёт собственных средств, что полностью исключает российский след из цепочки платежа",
    },
    {
      title: "Защита от убытков",
      description:
        "В случае возврата платежа мы вернём все средства по вашему запросу или предложим воспользоваться услугами нашей другой компании-плательщика",
    },
    {
      title: "Поддержка персонального менеджера",
      description:
        "Ваш прикреплённый менеджер на связи 24/7 и всегда готов ответить на ваши вопросы и обозначить статус платежа",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
      <div className="relative z-10">
        <h2 className="mb-12 text-center text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
          LIDER GARANT -{" "}
          <span className="text-foreground">РУЧАЕМСЯ ЗА РЕЗУЛЬТАТ</span>
        </h2>

        <div className="grid gap-12">
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1 shrink-0 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
