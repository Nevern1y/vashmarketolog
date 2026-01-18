export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Политика конфиденциальности
        </h1>

        <div className="bg-card rounded-lg shadow-md p-8 space-y-6 border border-border">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              1. Общие положения
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Настоящая политика конфиденциальности определяет, как наша
              компания собирает, использует, хранит и защищает информацию о
              пользователях нашего веб-сайта. Используя наш сайт, вы
              соглашаетесь с условиями настоящей политики.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              2. Собираемая информация
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Мы можем собирать следующую информацию:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                Имя и контактные данные (фамилия, имя, отчество, телефон, email)
              </li>
              <li>Финансовые данные (доход, сумма кредита, срок кредита)</li>
              <li>Информацию о трудоустройстве</li>
              <li>
                Техническую информацию (IP-адрес, данные браузера, время
                доступа)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              3. Использование информации
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Мы используем собранную информацию для:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Обработки заявок на кредитные продукты</li>
              <li>Связи с вами по вашему запросу</li>
              <li>Улучшения качества наших услуг</li>
              <li>Отправки информационных материалов (с вашего согласия)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              4. Защита данных
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Мы принимаем все необходимые меры для защиты вашей персональной
              информации от несанкционированного доступа, изменения, раскрытия
              или уничтожения. Данные хранятся на защищенных серверах и
              передаются по зашифрованным каналам связи.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              5. Передача данных третьим лицам
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Мы можем передавать вашу информацию банкам-партнерам для
              рассмотрения вашей кредитной заявки. Мы не продаем и не передаем
              вашу персональную информацию другим третьим лицам без вашего
              согласия, за исключением случаев, предусмотренных
              законодательством.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              6. Ваши права
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Вы имеете право:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Получать информацию о том, какие данные о вас хранятся</li>
              <li>Требовать исправления или удаления неверных данных</li>
              <li>Отозвать согласие на обработку персональных данных</li>
              <li>Подать жалобу в надзорный орган</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              7. Контакты
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Если у вас есть вопросы по политике конфиденциальности или вы
              хотите осуществить свои права, пожалуйста, свяжитесь с нами по
              электронной почте: privacy@lider-garant.ru
            </p>
          </section>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
