"use client";

import DealFeed from "@/components/deal-feed";
import FadeIn from "@/components/FadeIn";
import HowItWorksSection from "@/components/HowItWorksSection";
import ManagerCTASection from "@/components/ManagerCTASection";
import SeeAlso from "@/components/see-also";
import FaqSection from "@/components/FaqSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { GuaranteeSection } from "../../components/GuaranteeSection";
import { toast } from "sonner";
import { submitLead } from "@/lib/leads";
import type { SeoPageData } from "@/lib/seo-api";
import { normalizePopularSearches } from "@/lib/popular-searches";

const defaultPopularSearchTerms = [
  "международные платежи",
  "платежный агент",
  "трансграничные переводы",
  "расчеты в юанях",
  "расчеты в дирхамах",
  "оплата инвойсов",
  "валютный контроль",
  "оплата поставщику в Китай",
  "платежи в Турцию",
  "международные расчеты для ИП",
  "международные расчеты для ООО",
  "оплата товара за рубеж",
  "внешнеторговые платежи",
  "банковский перевод за границу",
  "swift альтернативы",
  "международный эквайринг",
  "конвертация валюты",
  "сопровождение ВЭД",
];

interface VedPageProps {
  seoPage?: SeoPageData | null;
}

export default function Page({ seoPage }: VedPageProps) {
  const popularSearches = normalizePopularSearches(
    seoPage?.popular_searches,
    defaultPopularSearchTerms,
    "/ved",
  );

  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [fromCurrency, setFromCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const amount = Number(paymentAmount);
    if (!fromCurrency || !toCurrency) {
      toast.error("Выберите валюту отправления и получения");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }

    if (contactPhone.replace(/\D/g, "").length < 11) {
      toast.error("Укажите корректный номер телефона");
      return;
    }

    setIsSubmitting(true);
    const result = await submitLead({
      full_name: "Клиент по ВЭД",
      phone: contactPhone,
      product_type: "ved",
      amount,
      source: "website_form",
      form_name: "ved_form",
      message: `Валюта отправления: ${fromCurrency}\nВалюта получения: ${toCurrency}\nСумма: ${amount}`,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error || "Произошла ошибка при отправке заявки");
      return;
    }

    setFromCurrency("");
    setToCurrency("");
    setPaymentAmount("");
    setContactPhone("");
    toast.success("Заявка отправлена! Мы свяжемся с вами в ближайшее время.");
  };

  const advantages = [
    {
      icon: "rocket.svg",
      title: "Быстрые платежи",
      description: "Переводим деньги за 1-3 дня по всему мира",
    },
    {
      icon: "/dollar.svg",
      title: "Низкие комиссии",
      description: "От 0,3% - лучшие условия на рынке",
    },
    {
      icon: "/shield.svg",
      title: "Надежно",
      description:
        "Выкупаем товар без российского следа, из любых стран в любой валюте",
    },
    {
      icon: "/checked.svg",
      title: "Международный охват",
      description:
        "8 компаний-партнёров в странах ЕС и Азии, что позволяет индивидуально подбирать компанию-плательщика, исходя из запроса клиента",
    },
    {
      icon: "/phone.svg",
      title: "Поддержка 24/7",
      description:
        "Предоставляем полную юридическую поддержку и оперативно работаем с запросами банков",
    },
    {
      icon: "/note.svg",
      title: "Полное сопровождение",
      description: "Поможем с документами и валютным контролем",
    },
  ];

  const unitedStreamAdvantages = [
    {
      icon: "/rocket.svg",
      title: "ПРОЗРАЧНО",
      description:
        "Предоставляем полную информацию о ходе сделки и комиссии уже на этапе консультации, а минимальное число посредников ускоряет процесс зачисления платежа",
    },
    {
      icon: "/shield.svg",
      title: "БЫСТРО",
      description:
        "Мы проводим платежи ежедневно и всегда имеем альтернативную компанию-плательщика, что позволяет оперативно реагировать на любые форс-мажоры",
    },
    {
      icon: "/checked.svg",
      title: "НАДЁЖНО",
      description:
        "Все условия фиксируются в официальном договоре, в случае возврата платежа мы оперативно возвращаем средства или используем наш зарубежный счёт для быстрого решения вопроса",
    },
  ];

  const internationalPaymentsServices = [
    {
      icon: "/phone.svg",
      title: "ОПЛАТА ИНВОЙСОВ",
      description:
        "Оплатим инвойс по агентскому договору в случаях, когда банки отказываются напрямую принимать деньги из России",
    },
    {
      icon: "/wallet.svg",
      title: "ВЫКУП ТОВАРОВ",
      description:
        "В случаях, когда продавец товара за границей отказывается продавать товар российскому покупателю, выкупим товар за вас от одной из наших европейских или азиатских компаний",
    },
    {
      icon: "/calculator.svg",
      title: "ОПЛАТА УСЛУГ",
      description:
        "Оплатим за вас роялти, выплату дивидендов, услуги дизайна и маркетинга и т.д. (для юридических лиц)",
    },
  ];

  const deals = Array.from({ length: 24 }).map((_, i) => ({
    title: [
      "Международные платежи",
      "Валютные платежи",
      "Трансграничные платежи",
      "Платежи за рубеж",
      "Платежи за границу",
      "Международные переводы",
      "Валютные переводы",
      "Трансграничные переводы",
      "Переводы за рубеж",
      "Перевод за границу",
      "Платежи в Китай",
      "Международный расчет",
    ][i % 6],
    amount: [
      "50 000 000 ₽",
      "26 205 355 ₽",
      "76 932 998 ₽",
      "37 955 980 ₽",
      "221 929 992 ₽",
      "30 000 000 ₽",
      "44 769 067 ₽",
    ][i % 7],
  }));

  const faqItems = [
    {
      q: "С какой компании будут осуществляться платежи?",
      a: "Лидер-Гарант обладает широкой базой зарубежных компаний для проведения международных платежей. Компания-плательщик подбирается индивидуально исходя из запроса клиента. Лидер-Гарант предлагает несколько вариантов компаний-плательщиков на ваш выбор.",
    },
    {
      q: "По какому курсу осуществляется оплата?",
      a: "Курс для оплаты согласовывается и фиксируется с клиентом по данным источника investing.com, однако в некоторых случаях курс может быть зафиксирован по данным ЦБ РФ (cbr.ru).",
    },
    {
      q: "Можете ли вы отказать в услуге?",
      a: "Мы стараемся проводить все платежи клиентов и всегда подходим индивидуально к каждому кейсу, однако, в редких случаях, мы можем отказать в проведении платежа, если он противоречит политике нашей организации или является незаконным на территории Российской Федерации.",
    },
    {
      q: "Какие сроки зачисления денежных средств поставщику?",
      a: "Средний срок зачисления средств поставщику 1-3 рабочих дня, однако он может меняться, в зависимости от заданных параметров со стороны клиента или рыночной ситуации. Возможны ситуации, когда мы можем делать платежи за несколько часов или даже осуществлять оплату вперед (для крупных клиентов).",
    },
    {
      q: "Какой размер комиссии и от чего зависит?",
      a: (
        <div>
          <p className="mb-3">
            Размер комиссии варьируется от 0,3 до 8% и зависит от следующих
            параметров:
          </p>
          <ul className="ml-3 space-y-1">
            <li>• Сумма платежа</li>
            <li>• Валюта платежа</li>
            <li>• Предмет платежа и желаемое назначение</li>
            <li>• География получателя</li>
            <li>• Публичная репутация получателя</li>
          </ul>
        </div>
      ),
    },
    {
      q: "Как я могу быть уверен, что деньги дойдут?",
      a: "Компания Лидер-Гарант сотрудничает с крупными банками. Мы ценим свою деловую репутацию и выстраиваем долгосрочное сотрудничество как с клиентами, так и с партнерами. Лидер-Гарант гарантирует полное возмещение комиссии и платежа.",
    },
  ];

  const faqs = [
    "платежи в китай",
    "платежи в европу",
    "платежи в турцию",
    "платежи в индию",
    "платежи в иран",
    "платежи в оаэ",
    "платежи в дубай",
    "платежи в японию",
    "платежи в корею",
    "оплата международных платежей",
    "платежный агент",
    "международные расчеты",
    "услуга международных платежей",
    "платформа международных платежей",
    "переводы за границу",
    "переводы за рубеж",
    "вэд платежи",
    "международные переводы",
    "перевод денег за границу",
    "международные платежи и расчеты",
    "международные банковские платежи",
    "проведение международных платежей",
    "получать международные платежи",
    "платежи в международной торговле",
    "перевод зарубеж",
    "международные платежи для бизнеса",
    "принимать международные платежи",
    "сервисы международных платежей",
    "международные трансграничные платежи",
    "международные онлайн платежи",
    "платформа трансграничных платежей",
    "трансграничная система платежей",
    "денежные переводы зарубеж",
    "валютные переводы",
    "банковский платежный агент",
    "услуги платежного агента",
    "оплата через платежного агента",
    "платежный агент перевод",
    "платежный агент поставщик",
    "платежный агент вэд",
    "валютные денежные переводы",
    "переводы за границу из россии",
    "денежный перевод за границу",
    "перевод валюты за границу",
    "перевод средств за рубеж",
    "международные денежные переводы",
    "валютные платежи",
    "валютные платежи за границу",
    "проведение валютных платежей",
    "международные переводы",
    "международные денежные переводы",
    "международный банковский перевод",
    "проведение международных расчетов",
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 md:py-16">
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 p-4 sm:p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <Image
              src="/economic-activity.jpg"
              alt="Background"
              fill
              className="object-cover"
            />
          </div>

          <div className="relative grid items-center gap-6 sm:gap-8 md:grid-cols-2">
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                  <span className="text-foreground">Международные</span>
                  <br />
                  <span className="text-foreground">платежи </span>
                  <br />
                  <span className="text-primary">для бизнеса.</span>
                </h1>
              </div>

              <div className="space-y-3">
                <p className="text-base text-foreground/75 leading-relaxed">
                  Поможем перевести деньги, получить оплату из‑за рубежа без
                  ограничения по суммам в любой валюте.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    от 0,3%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-base font-semibold text-foreground">
                    от 1 дня
                  </span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6">
                <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-foreground">
                  Получите предложение
                </h3>
                <form
                  className="space-y-3 sm:space-y-4"
                  onSubmit={handleFormSubmit}
                >
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="from-currency"
                      className="text-xs sm:text-sm font-medium text-foreground/90"
                    >
                      Валюта отправления
                    </Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="h-10 sm:h-11 w-full rounded-full border border-foreground/15 bg-background/90 px-3 sm:px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RUB">
                          RUB - Российский рубль
                        </SelectItem>
                        <SelectItem value="USD">USD - Доллар США</SelectItem>
                        <SelectItem value="EUR">EUR - Евро</SelectItem>
                        <SelectItem value="CNY">
                          CNY - Китайский юань
                        </SelectItem>
                        <SelectItem value="AED">AED - Дирхам ОАЭ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="to-currency"
                      className="text-xs sm:text-sm font-medium text-foreground/90"
                    >
                      Валюта получения
                    </Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="h-10 sm:h-11 w-full rounded-full border border-foreground/15 bg-background/90 px-3 sm:px-4 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Выберите валюту" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RUB">
                          RUB - Российский рубль
                        </SelectItem>
                        <SelectItem value="USD">USD - Доллар США</SelectItem>
                        <SelectItem value="EUR">EUR - Евро</SelectItem>
                        <SelectItem value="CNY">
                          CNY - Китайский юань
                        </SelectItem>
                        <SelectItem value="AED">AED - Дирхам ОАЭ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="amount"
                      className="text-xs sm:text-sm font-medium text-foreground/90"
                    >
                      Сумма к оплате
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Введите сумму"
                      className="h-10 sm:h-11 rounded-full border text-foreground border-foreground/15 bg-background/90 px-3 sm:px-4 text-sm"
                      value={paymentAmount}
                      onChange={(event) => setPaymentAmount(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-xs sm:text-sm font-medium text-foreground/90"
                    >
                      Телефон
                    </Label>
                    <PhoneInput
                      id="phone"
                      className="h-10 sm:h-11 rounded-full text-foreground border border-foreground/15 bg-background/90 px-3 sm:px-4 text-sm"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-10 sm:h-12 btn-three w-full text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Отправка..." : "Получить предложение"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-8 w-full max-w-7xl py-8">
          <h2 className="mb-8 text-3xl font-bold text-primary text-center">
            Преимущества
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {advantages.map((advantage, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary shadow-2xl hover:shadow-primary/20"
              >
                <div className="mb-4 flex h-24 w-24 items-center justify-center text-primary">
                  <Image
                    src={advantage.icon}
                    alt={advantage.title}
                    width={100}
                    height={100}
                    className="h-24 w-24"
                  />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-primary">
                  {advantage.title}
                </h3>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {advantage.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="absolute inset-0 opacity-5">
            <Image
              src="/economic-activity.jpg"
              alt="Background"
              fill
              className="object-cover"
            />
          </div>

          <div className="relative z-10">
            <div className="mb-12 grid gap-8 md:grid-cols-2">
              <h2 className="text-5xl font-bold tracking-tight text-foreground">
                <span className="text-primary">Lider garant</span> - РАБОТАЕМ
                БЫСТРЕЕ БАНКОВ
              </h2>
              <div className="space-y-4">
                <p className="text-foreground/80 leading-relaxed">
                  Lider garant - это современная платежная система, которая
                  позволяет быстро и безопасно выводить деньги с любых платформ
                  и бирж. Мы работаем с 2018 года и за это время помогли тысячам
                  клиентов по всему миру.
                </p>
                <p className="text-foreground/80 leading-relaxed">
                  Наши клиенты - это трейдеры, инвесторы и владельцы бизнеса,
                  которые ценят скорость, надежность и конфиденциальность. Мы
                  предлагаем лучшие условия на рынке и индивидуальный подход к
                  каждому клиенту.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {unitedStreamAdvantages.map((advantage, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary shadow-2xl hover:shadow-primary/20"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Image
                      src={advantage.icon}
                      alt="Icon"
                      width={100}
                      height={100}
                      className="h-16 w-16"
                    />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-primary">
                    {advantage.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {advantage.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
                Международные расчёты без границ — оплачиваем то, что неудобно
                другим
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                Компания United Stream помогает{" "}
                <span className="text-primary">юридическим лицам</span> и ИП
                легко совершать и получать платежи, предлагая следующие услуги:
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {internationalPaymentsServices.map((service, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary shadow-2xl hover:shadow-primary/20 text-center"
                >
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                    <Image
                      src={service.icon}
                      alt={service.title}
                      width={100}
                      height={100}
                      className="w-16 h-16"
                    />
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-primary">
                    {service.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
                Предлагаем выгодные проценты комиссии
                <br />
                при неизменно высоком качестве
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-2 text-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl">
                <h3 className="mb-4 text-2xl font-bold text-foreground">
                  Отправить платёж{" "}
                  <span className="text-primary">за границу</span> из России
                </h3>
                <p className="mb-2 text-5xl font-bold text-primary">0,3%</p>
                <p className="mb-4 text-lg text-foreground/70">комиссия</p>
                <p className="text-sm text-foreground/50">
                  *От цены инвойса без скрытых платежей. Процент комиссии
                  зависит от страны назначения платежа
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl">
                <h3 className="mb-4 text-2xl font-bold text-foreground">
                  Получить платёж{" "}
                  <span className="text-primary">из-за границы</span> в Россию
                </h3>
                <p className="mb-2 text-5xl font-bold text-primary">от 0%</p>
                <p className="mb-4 text-lg text-foreground/70">комиссия</p>
                <p className="text-sm text-foreground/50">
                  На получение экспортной выручки в валюте и рублях
                </p>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
                Условия сотрудничества
              </h2>
            </div>

            <div className="mb-8 flex justify-center">
              <div className="inline-flex rounded-full bg-white/5 p-1">
                <button
                  onClick={() => setActiveTab("import")}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    activeTab === "import"
                      ? "bg-primary text-[oklch(0.141_0.005_285.823)]"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  ИМПОРТ (ПЛАТЕЖИ ЗА ГРАНИЦУ)
                </button>
                <button
                  onClick={() => setActiveTab("export")}
                  className={`px-6 py-2 rounded-full font-medium transition-colors ${
                    activeTab === "export"
                      ? "bg-primary text-[oklch(0.141_0.005_285.823)]"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  ЭКСПОРТ (ПЛАТЕЖИ В РОССИЮ)
                </button>
              </div>
            </div>

            <div className="gap-8 flex justify-center items-center">
              {activeTab === "import" ? (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Международные расчёты для импортных поставок
                  </h3>
                  <p className="text-lg font-medium text-foreground mb-6">
                    Комиссия платежного агента:{" "}
                    <span className="text-2xl text-primary">0,3%</span>
                  </p>
                  <ul className="space-y-4 text-left inline-block">
                    {[
                      "Оплата по агентскому договору",
                      "Оплата инвойсов в валюте контракта",
                      "Выкуп товара от нашего имени",
                      "Помощь с валютным контролем",
                      "Консультации по документам",
                      "Отслеживание платежей",
                      "Персональный менеджер",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-6 w-6 text-primary mr-3 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Международные расчёты для экспортных поставок
                  </h3>
                  <p className="text-lg font-medium text-foreground mb-6">
                    Комиссия платежного агента:{" "}
                    <span className="text-2xl text-primary">от 0%</span>
                  </p>
                  <ul className="space-y-4 text-left inline-block">
                    {[
                      "Конкурентоспособные условия для экспортных платежей с комиссией от 0%.",
                      "Наша команда экспертов всегда готова помочь вам в осуществлении международных расчетов, обеспечивая безопасность как для отправителя, так и для получателя.",
                      "Обширная сеть международных представительств в 7 странах, позволяет нам выбирать оптимальные юрисдикции для получения платежей, полностью исключая российский след.",
                      "Берём на себя подготовку всей необходимой документации для успешного совершения сделок, позволяя вам сосредоточиться на развитии бизнеса.",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-6 w-6 text-primary mr-3 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-foreground/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
                Как это работает /{" "}
                {activeTab === "import" ? "Импорт" : "Экспорт"}
              </h2>
              <p className="text-xl text-foreground/80 leading-relaxed max-w-3xl mx-auto">
                {activeTab === "import"
                  ? "Переводите оплату поставщикам из любых стран"
                  : "Принимайте оплату от заказчиков из любых стран"}
              </p>
            </div>

            {/* Flow Diagram */}
            <div className="mb-16 overflow-x-auto">
              <div className="flex justify-center items-center min-w-max px-4">
                <div className="flex items-center gap-2 md:gap-4">
                  {activeTab === "import" ? (
                    <>
                      <div className="flex flex-col items-center text-center w-20 md:w-24">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Заказчик в России
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-20 md:w-24">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Получатель платежа
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-20 md:w-24">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Договор купли-продажи
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-20 md:w-24">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Отправитель платежа
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-20 md:w-24">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Поставщик за рубежом
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center text-center w-24 md:w-28">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 1.343-3 3v1H8a2 2 0 00-2 2v3a2 2 0 002 2h8a2 2 0 002-2v-3a2 2 0 00-2-2h-1v-1c0-1.657-1.343-3-3-3z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Отправитель
                          <br />
                          ДС
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-24 md:w-28">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Получатель платежа
                          <br />
                          за границей
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-32 md:w-36">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex flex-col items-center justify-center mb-2 px-2 py-2">
                          <span className="text-[9px] md:text-[10px] font-bold text-emerald-500 leading-tight uppercase">
                            Агентский
                            <br />
                            договор
                          </span>
                          <span className="mt-0.5 text-[8px] md:text-[9px] text-foreground/60 leading-none">
                            комиссия
                          </span>
                          <span className="text-xl md:text-3xl font-extrabold text-primary leading-none mt-0.5">
                            0%
                          </span>
                        </div>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-24 md:w-28">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Отправитель
                          <br />
                          платежа / агент
                        </span>
                      </div>

                      <svg
                        className="w-4 h-4 md:w-6 md:h-6 text-primary shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>

                      <div className="flex flex-col items-center text-center w-24 md:w-28">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">
                          Компания
                          <br />
                          получатель
                          <br />в России
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {activeTab === "import" ? (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      Заключаем агентский договор или договор купли-продажи с
                      вашим бизнесом в России от имени нашей иностранной
                      компании со счётом в российском банке
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      Ваш поставщик из Китая, Европы или другой страны
                      выставляет счёт на нашу иностранную компанию-плательщика
                      без российского следа, зарегистрированную в Дубае,
                      Гонконге или ЕС
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      На основании полученного счёта наша иностранная компания
                      выставляет счёт вашей российской компании в рублях,
                      включая наше агентское вознаграждение
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">4</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      После получения оплаты от вашей компании, мы осуществляем
                      платеж вашему поставщику в Китае, Европе или другой стране
                      через нашу компанию-плательщика (ОАЭ, Гонконг или ЕС)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">1</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      Вы, как экспортёр из России, подписываете агентский
                      договор с нашей иностранной компанией, имеющей рублевый
                      счёт
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">2</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      Наша компания за границей (не связанная с Россией) от
                      своего лица выставляет счёт вашему покупателю за продукцию
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      Ваш клиент переводит средства на счёт нашей иностранной
                      компании в ЕС, ОАЭ или Гонконге
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">4</span>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                      После получения оплаты от вашего клиента, наша иностранная
                      компания со счётом в российском банке переводит вам деньги
                      в рублях
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 md:p-12 my-12">
          <div className="relative z-10 grid gap-8 md:grid-cols-[1fr_auto] items-center">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary">
                Нужно больше информации?
              </h2>
              <p className="text-lg text-foreground/80 leading-relaxed">
                Звоните и наши менеджеры подробно вам всё расскажут!
              </p>
            </div>
            <div>
              <Button
                size="lg"
                className="btn-three h-14 px-8 text-base font-semibold whitespace-nowrap"
                onClick={() => {
                  const contactSection = document.getElementById("contact");
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Заказать звонок
              </Button>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-4">
                ПОПУЛЯРНЫЕ НАПРАВЛЕНИЯ ПЛАТЕЖЕЙ
              </h2>
            </div>

            <div className="max-w-3xl mx-auto mb-12">
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg
                    className="h-6 w-6 text-emerald-500 mr-3 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground/90">От любой суммы</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-6 w-6 text-emerald-500 mr-3 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground/90">
                    Валюты: доллары, евро, юани, дирхамы, рубли, лиры
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-6 w-6 text-emerald-500 mr-3 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-foreground/90">Срок: 1-3 дней</span>
                </li>
              </ul>

              <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-center text-foreground/90 font-medium">
                  Не находите своего направления или валюты?{" "}
                  <Link
                    href="#contact"
                    className="text-primary hover:underline font-semibold"
                  >
                    Свяжитесь с нами!
                  </Link>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mt-12">
              {[
                { name: "Южная Корея", code: "kr", img: "/korea.webp" },
                { name: "Турция", code: "tr", img: "/turkey.webp" },
                { name: "Китай", code: "cn", img: "/china.webp" },
                { name: "ОАЭ", code: "ae", img: "/oae.jpg" },
                { name: "Япония", code: "jp", img: "/japan.webp" },
              ].map((country) => (
                <div
                  key={country.code}
                  className="flex flex-col items-center group"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20   flex items-center justify-center mb-3 overflow-hidden transition-all duration-300">
                    <Image
                      src={country.img}
                      alt={country.name}
                      width={100}
                      height={100}
                    />
                  </div>
                  <span className="text-center text-foreground/90 font-medium text-sm md:text-base">
                    {country.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  Платёжные решения,{" "}
                  <span className="text-primary">проверенные годами</span>
                </h2>

                <p className="text-base text-foreground/80 leading-relaxed">
                  Lider Garant — это современная платежная система, которая
                  позволяет быстро и безопасно выводить деньги с любых платформ
                  и бирж. Мы работаем с 2018 года и за это время помогли тысячам
                  клиентов по всему миру.
                </p>

                <p className="text-base text-foreground/80 leading-relaxed">
                  Наши клиенты — это трейдеры, инвесторы и владельцы бизнеса,
                  которые ценят скорость, надёжность и конфиденциальность. Мы
                  предлагаем лучшие условия на рынке и индивидуальный подход к
                  каждому клиенту.
                </p>

                <Link href="/about">
                  <Button className="btn-three h-12">
                    Подробнее о компании
                  </Button>
                </Link>
              </div>

              <div className="relative grid grid-cols-2 gap-4">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/insuarance.jpg"
                    alt="Payment interface with hand interaction"
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="relative rounded-xl overflow-hidden shadow-lg border border-primary/30">
                  <Image
                    src="/guarantee.png"
                    alt="United Stream building"
                    width={300}
                    height={200}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <HowItWorksSection />
      </FadeIn>

      <FadeIn>
        <GuaranteeSection />
      </FadeIn>

      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 via-sky-500/5 to-emerald-500/5 p-8 md:p-12 my-12">
          <div className="relative z-10">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-primary">
                    МОЖЕМ ДОСТАВИТЬ
                  </h2>
                  <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                    ВАШ ВЫКУПЛЕННЫЙ ТОВАР В РОССИЮ ЧЕРЕЗ НАШУ
                    ТРАНСПОРТНО-ЛОГИСТИЧЕСКУЮ КОМПАНИЮ-ПАРТНЁРА
                  </h3>
                </div>

                <div className="space-y-4 text-foreground/80 leading-relaxed">
                  <p>
                    <span className="font-semibold text-primary">
                      ЛЖ Логистик
                    </span>{" "}
                    - это надёжная логистическая компания, специализирующаяся на
                    перевозке грузов из Европы в Россию. Более 15 лет мы
                    обеспечиваем бесперебойные поставки для наших клиентов.
                  </p>
                  <p>
                    Наши клиенты могут быть уверены в нашей профессиональной
                    работе и высоком качестве сервиса.
                  </p>
                </div>
              </div>

              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
                <h3 className="mb-6 text-2xl font-bold text-foreground">
                  Достижения компании ЛЖ Логистик за 2024 год:
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "100% успешно доставленных грузов",
                    "> 1025 грузов доставлено",
                    "> 43 стран участвующих в доставках",
                    "> 155 постоянных клиентов",
                  ].map((achievement, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-white/5 border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="h-6 w-6 flex items-center justify-center mr-3">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {achievement}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto mt-2 w-full max-w-7xl py-8">
          <div className="mb-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-primary ">
                Лента сделок
              </h2>
              <p className="text-sm text-foreground/60">
                Последние заявки от наших клиентов и агентов
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground ">
                3 064 379 982 ₽
              </div>
              <div className="text-xs text-foreground/60">
                Общая сумма последних заявок
              </div>
            </div>
          </div>
          <div className="py-5">
            <DealFeed deals={deals} />
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <SeeAlso currentPage="ved" />
      </FadeIn>

      <FadeIn>
        <FaqSection
          title="Вопросы по международным платежам"
          items={faqItems}
        />
      </FadeIn>

      <FadeIn>
        <div id="contact">
          <ManagerCTASection />
        </div>
      </FadeIn>

      <FadeIn>
        <section className="mx-auto w-full max-w-7xl py-12">
          <h2 className="mb-10 text-4xl text-center font-bold text-primary ">
            Часто ищут
          </h2>

          <div className="rounded-xl border border-foreground/10 bg-white/5 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6">
              {popularSearches.map((item, i) => (
                <div key={i}>
                  {item.href.startsWith("http://") ||
                  item.href.startsWith("https://") ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="nav-link link-gradient"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <Link href={item.href} className="nav-link link-gradient">
                      {item.text}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>
    </main>
  );
}
