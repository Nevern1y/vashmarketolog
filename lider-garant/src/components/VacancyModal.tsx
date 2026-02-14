"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Phone, MapPin, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/phone-input";
import { submitLead } from "@/lib/leads";

interface Vacancy {
  id: number;
  title: string;
  salary: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  conditions?: string[];
  schedule?: string;
  location?: string;
  team?: string;
}

interface Props {
  vacancy: Vacancy | null;
  open: boolean;
  onClose: () => void;
}

const defaultVacancyData: Record<number, Partial<Vacancy>> = {
  1: {
    requirements: [
      "Опыт работы в подборе персонала от 1 года",
      "Высшее образование",
      "Знание методов поиска и оценки кандидатов",
      "Навыки ведения переговоров",
      "Уверенный пользователь ПК",
    ],
    responsibilities: [
      "Поиск и подбор персонала для различных отделов",
      "Проведение собеседований",
      "Ведение базы кандидатов",
      "Сотрудничество с руководителями отделов",
      "Организация процесса адаптации новых сотрудников",
    ],
    conditions: [
      "Конкурентная заработная плата",
      "Официальное трудоустройство по ТК РФ",
      "ДМС после испытательного срока",
      "Обучение и профессиональное развитие",
      "Комфортный офис в центре Москвы",
    ],
    schedule: "5/2 с 9:00 до 18:00",
    location: "Москва, м. Арбатская",
    team: "HR отдел - 12 человек",
  },
  2: {
    requirements: [
      "Опыт работы в call-центре или с клиентами приветствуется",
      "Грамотная речь",
      "Уверенный пользователь ПК",
      "Стрессоустойчивость",
      "Клиентоориентированность",
    ],
    responsibilities: [
      "Консультирование клиентов по финансовым продуктам",
      "Обработка входящих звонков и заявок",
      "Ведение клиентской базы",
      "Информирование о продуктах и услугах компании",
      "Достижение плановых показателей",
    ],
    conditions: [
      "Конкурентная заработная плата + бонусы",
      "Официальное трудоустройство",
      "Обучение и наставничество",
      "Возможность карьерного роста",
      "Сменный график",
    ],
    schedule: "Сменный график (2/2, 3/3)",
    location: "Москва, м. Курская",
    team: "Call-центр - 25+ человек",
  },
  3: {
    requirements: [
      "Опыт работы в B2B продажах от 2 лет",
      "Высшее образование",
      "Навыки ведения переговоров",
      "Знание английского языка будет преимуществом",
      "Водительские права",
    ],
    responsibilities: [
      "Работа с корпоративными клиентами",
      "Развитие партнерских отношений",
      "Поиск новых клиентов и рынков",
      "Заключение договоров",
      "Контроль исполнения обязательств",
    ],
    conditions: [
      "Высокая заработная плата + % от сделок",
      "Официальное трудоустройство",
      "Корпоративный телефон и ноутбук",
      "Командировки оплачиваются",
      "Гибкий график",
    ],
    schedule: "5/2 с 9:00 до 18:00",
    location: "Москва, м. Смоленская",
    team: "Отдел B2B продаж - 8 человек",
  },
  4: {
    requirements: [
      "Опыт управления командой от 3 лет",
      "Опыт в продажах от 5 лет",
      "Высшее образование",
      "Лидерские качества",
      "Стратегическое мышление",
    ],
    responsibilities: [
      "Управление командой продаж",
      "Постановка планов и контроль их выполнения",
      "Обучение и развитие сотрудников",
      "Анализ рынка и конкурентов",
      "Разработка стратегий продаж",
    ],
    conditions: [
      "Высокий доход (оклад + бонусы)",
      "Официальное трудоустройство",
      "ДМС для семьи",
      "Обучение за счет компании",
      "Парковка",
    ],
    schedule: "5/2 с 9:00 до 19:00",
    location: "Москва, м. Пушкинская",
    team: "Отдел продаж - 15 человек",
  },
  5: {
    requirements: [
      "Высшее финансовое или экономическое образование",
      "Опыт работы в банке или финансовой компании",
      "Аналитический склад ума",
      "Внимательность к деталям",
      "Знание Excel на продвинутом уровне",
    ],
    responsibilities: [
      "Анализ кредитных заявок",
      "Оценка кредитных рисков",
      "Подготовка аналитических отчетов",
      "Работа с кредитной документацией",
      "Консультирование по кредитным продуктам",
    ],
    conditions: [
      "Конкурентная заработная плата",
      "Официальное трудоустройство",
      "ДМС",
      "Обучение и сертификация",
      "Карьерный рост",
    ],
    schedule: "5/2 с 9:30 до 18:30",
    location: "Москва, м. Тверская",
    team: "Кредитный отдел - 10 человек",
  },
  6: {
    requirements: [
      "Опыт работы в маркетинге от 2 лет",
      "Высшее образование (маркетинг, реклама)",
      "Знание цифровых инструментов маркетинга",
      "Творческий подход",
      "Аналитические способности",
    ],
    responsibilities: [
      "Разработка маркетинговых стратегий",
      "Ведение социальных сетей",
      "Организация рекламных кампаний",
      "Анализ эффективности маркетинга",
      "Работа с подрядчиками",
    ],
    conditions: [
      "Конкурентная заработная плата",
      "Официальное трудоустройство",
      "Бюджет на обучение",
      "Творческая команда",
      "Возможность удаленной работы",
    ],
    schedule: "5/2 с 10:00 до 19:00",
    location: "Москва, м. Китай-город",
    team: "Маркетинг - 6 человек",
  },
  7: {
    requirements: [
      "Опыт работы помощником руководителя от 1 года",
      "Высшее образование",
      "Отличные организационные навыки",
      "Уверенный пользователь ПК (MS Office)",
      "Знание делового этикета",
    ],
    responsibilities: [
      "Организационная поддержка руководителя",
      "Ведение документооборота",
      "Планирование встреч и поездок",
      "Подготовка презентаций и отчетов",
      "Коммуникация с партнерами",
    ],
    conditions: [
      "Конкурентная заработная плата",
      "Официальное трудоустройство",
      "ДМС",
      "Комфортные условия труда",
      "Профессиональный рост",
    ],
    schedule: "5/2 с 9:00 до 18:00",
    location: "Москва, м. Новослободская",
    team: "Администрация - 4 человека",
  },
  8: {
    requirements: [
      "Опыт в HR или обучении персонала от 2 лет",
      "Высшее образование (психология, HR)",
      "Навыки разработки обучающих программ",
      "Коммуникативные навыки",
      "Творческий подход",
    ],
    responsibilities: [
      "Разработка программ обучения",
      "Проведение тренингов и семинаров",
      "Адаптация новых сотрудников",
      "Оценка эффективности обучения",
      "Развитие корпоративной культуры",
    ],
    conditions: [
      "Конкурентная заработная плата",
      "Официальное трудоустройство",
      "ДМС",
      "Бюджет на развитие",
      "Интересные задачи",
    ],
    schedule: "5/2 с 10:00 до 19:00",
    location: "Москва, м. Чеховская",
    team: "HR отдел - 12 человек",
  },
  9: {
    requirements: [
      "Опыт работы в банке или финансовой компании",
      "Знание кредитных продуктов",
      "Высшее образование",
      "Навыки продаж",
      "Клиентоориентированность",
    ],
    responsibilities: [
      "Оформление кредитных продуктов",
      "Консультирование клиентов",
      "Проверка кредитной истории",
      "Работа с документацией",
      "Достижение плановых показателей",
    ],
    conditions: [
      "Конкурентная заработная плата + бонусы",
      "Официальное трудоустройство",
      "Обучение",
      "Карьерный рост",
      "ДМС",
    ],
    schedule: "5/2 с 9:00 до 18:00",
    location: "Москва, м. Кутузовская",
    team: "Кредитный отдел - 10 человек",
  },
};

export default function VacancyModal({ vacancy, open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setName("");
      setPhone("");
      setEmail("");
      setCoverLetter("");
      setIsSubmitting(false);
    }
  }, [open]);

  if (!mounted || !vacancy) return null;

  const detailedVacancy = {
    ...vacancy,
    ...defaultVacancyData[vacancy.id],
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const messageParts = [`Отклик на вакансию: ${detailedVacancy.title}`];
      if (coverLetter.trim()) {
        messageParts.push(`Сопроводительное письмо: ${coverLetter.trim()}`);
      }

      const result = await submitLead({
        full_name: name.trim(),
        phone,
        email: email.trim() || undefined,
        source: "website_form",
        form_name: "vacancy_modal",
        message: messageParts.join("\n"),
      });

      if (!result.ok) {
        toast.error(result.error || "Ошибка отправки отклика");
        return;
      }

      toast.success("Отклик отправлен. Мы свяжемся с вами в ближайшее время.");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ошибка отправки отклика";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {detailedVacancy.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
              <span>💰</span>
              {detailedVacancy.salary}
            </div>

            {detailedVacancy.schedule && (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Clock className="h-4 w-4" />
                {detailedVacancy.schedule}
              </div>
            )}

            {detailedVacancy.location && (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <MapPin className="h-4 w-4" />
                {detailedVacancy.location}
              </div>
            )}

            {detailedVacancy.team && (
              <div className="flex items-center gap-2 text-sm text-foreground/70">
                <Users className="h-4 w-4" />
                {detailedVacancy.team}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">О вакансии</h3>
            <p className="text-foreground/80 leading-relaxed">
              {detailedVacancy.description}
            </p>
          </div>

          {detailedVacancy.responsibilities && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Обязанности</h3>
              <ul className="space-y-2">
                {detailedVacancy.responsibilities.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-foreground/80"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detailedVacancy.requirements && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Требования</h3>
              <ul className="space-y-2">
                {detailedVacancy.requirements.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-foreground/80"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {detailedVacancy.conditions && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Условия</h3>
              <ul className="space-y-2">
                {detailedVacancy.conditions.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-foreground/80"
                  >
                    <span className="text-primary mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-foreground/10 pt-6">
            <h3 className="text-lg font-semibold mb-4">
              Откликнуться на вакансию
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ваше имя *
                </label>
                <input
                  type="text"
                  placeholder="Введите ваше имя"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Телефон *
                </label>
                <PhoneInput
                  placeholder="+7 (___) ___-__-__"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Сопроводительное письмо
                </label>
                <textarea
                  placeholder="Расскажите, почему вы подходите на эту должность..."
                  rows={4}
                  value={coverLetter}
                  onChange={(event) => setCoverLetter(event.target.value)}
                  className="w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm outline-none focus:border-foreground/30 transition-colors resize-none"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  className="h-12 flex-1 btn-three"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Отправить отклик"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  onClick={() => window.open("tel:+74957452720")}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Позвонить
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
