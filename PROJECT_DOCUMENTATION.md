# 📋 ПОЛНАЯ ДОКУМЕНТАЦИЯ ПРОЕКТА: SaaS Financial Marketplace MVP

**Дата создания:** 2025-12-27
**Статус:** MVP Stage 1 — Готов к тестированию
**Архитектура:** "API-Ready" + "Manual Mode Only"

---

## 📁 СТРУКТУРА ПРОЕКТА

```
d:\New folder\dashboarddesignanalysis\
├── backend/                          # Django REST Framework API
│   ├── apps/
│   │   ├── users/                    # Модель пользователя (4 роли)
│   │   ├── companies/                # Профиль компании + паспорт + учредители
│   │   ├── applications/             # Заявки + решения партнёров
│   │   ├── documents/                # Загрузка и хранение документов
│   │   └── chat/                     # WebSocket чат (не в MVP)
│   ├── config/                       # Django settings
│   └── manage.py
│
├── app/                              # Next.js 14 (App Router)
│   └── page.tsx                      # Главная страница + роутинг по ролям
│
├── components/
│   ├── auth/
│   │   └── auth-page.tsx             # Страница авторизации/регистрации
│   ├── dashboard/
│   │   ├── sidebar.tsx               # Сайдбар для AGENT
│   │   ├── client-sidebar.tsx        # Сайдбар для CLIENT
│   │   ├── partner-sidebar.tsx       # Сайдбар для PARTNER
│   │   ├── admin-dashboard.tsx       # Панель администратора
│   │   ├── my-company-view.tsx       # Профиль компании (CLIENT/AGENT)
│   │   ├── create-application-wizard.tsx  # Мастер создания заявки
│   │   ├── my-applications-view.tsx  # Список заявок
│   │   ├── my-documents-view.tsx     # Библиотека документов
│   │   ├── partner-application-detail.tsx  # Детали заявки для PARTNER
│   │   └── ...
│   └── ui/                           # shadcn/ui компоненты
│
├── hooks/
│   ├── use-applications.ts           # API хуки для заявок
│   ├── use-companies.ts              # API хуки для компаний
│   ├── use-documents.ts              # API хуки для документов
│   └── use-chat.ts                   # WebSocket чат
│
├── lib/
│   ├── api.ts                        # HTTP клиент (axios wrapper)
│   ├── auth-context.tsx              # React Context для аутентификации
│   └── types.ts                      # TypeScript типы
│
└── docker-compose.yml                # PostgreSQL + MinIO + Redis
```

---

## 👥 СИСТЕМА РОЛЕЙ (4 РОЛИ)

### 1️⃣ CLIENT (Клиент)
- Регистрируется самостоятельно
- Заполняет профиль своей компании
- Создаёт заявки на финансовые продукты
- Видит статус своих заявок
- Загружает документы в библиотеку

### 2️⃣ AGENT (Агент/Брокер)
- Регистрируется самостоятельно
- Ведёт CRM клиентов (чужие компании)
- Создаёт заявки от имени клиентов
- Выбирает документы из библиотеки клиента
- Видит все свои заявки и заявки клиентов

### 3️⃣ PARTNER (Партнёр/Банк)
- Регистрируется только по приглашению Admin
- Видит ТОЛЬКО назначенные ему заявки
- Может: Одобрить / Отклонить / Запросить информацию
- Видит полные данные компании (включая паспорт директора)

### 4️⃣ ADMIN (Администратор)
- Видит ВСЕ заявки со всех источников
- Назначает заявки партнёрам (маршрутизация)
- Видит колонку "Целевой банк" для быстрой сортировки
- Управляет пользователями

---

## 🗄️ БАЗА ДАННЫХ (Django Models)

### User (apps/users/models.py)
```python
class User:
    email: EmailField (unique, USERNAME_FIELD)
    phone: CharField
    role: CharField (client/agent/partner/admin)
    first_name: CharField
    last_name: CharField
    is_active: BooleanField
    is_staff: BooleanField
    invite_token: UUIDField (для приглашения Partner)
    date_joined: DateTimeField
```

### CompanyProfile (apps/companies/models.py)
```python
class CompanyProfile:
    # Владелец
    owner: ForeignKey(User)
    is_crm_client: BooleanField (True = клиент агента)
    
    # Идентификация
    inn: CharField(12)
    kpp: CharField(9)
    ogrn: CharField(15)
    name: CharField(500)
    short_name: CharField(200)
    
    # Адреса
    legal_address: TextField
    actual_address: TextField
    
    # Директор
    director_name: CharField(300)
    director_position: CharField(100)
    
    # ⭐ ПАСПОРТ ДИРЕКТОРА (API-Ready для Реалист Банка)
    passport_series: CharField(4)        # "0000"
    passport_number: CharField(6)        # "000000"
    passport_issued_by: TextField        # "ОВД по г.Москве"
    passport_date: DateField             # Дата выдачи
    passport_code: CharField(7)          # "000-000"
    
    # ⭐ УЧРЕДИТЕЛИ (JSONField для MVP)
    founders_data: JSONField
    # Формат: [{"name": "Иванов И.И.", "inn": "123456789012", "share": 50.0}]
    
    # ⭐ БАНКОВСКИЕ СЧЕТА (JSONField для MVP)
    bank_accounts_data: JSONField
    # Формат: [{"account": "40702810...", "bic": "044525000", "bank_name": "Сбербанк"}]
    
    # Основной счёт (для обратной совместимости)
    bank_name: CharField
    bank_bic: CharField(9)
    bank_account: CharField(20)
    bank_corr_account: CharField(20)
    
    # Контакты
    contact_person: CharField
    contact_phone: CharField
    contact_email: EmailField
    website: URLField
```

### Application (apps/applications/models.py)
```python
class ProductType:
    BANK_GUARANTEE = 'bank_guarantee'  # Банковская гарантия
    TENDER_LOAN = 'tender_loan'        # Тендерный кредит
    FACTORING = 'factoring'            # Факторинг
    LEASING = 'leasing'                # Лизинг

class ApplicationStatus:
    DRAFT = 'draft'                    # Черновик
    PENDING = 'pending'                # На рассмотрении
    IN_REVIEW = 'in_review'            # В работе у партнёра
    INFO_REQUESTED = 'info_requested'  # Запрошена информация
    APPROVED = 'approved'              # Одобрено
    REJECTED = 'rejected'              # Отклонено
    WON = 'won'                        # Выигран (тендер)
    LOST = 'lost'                      # Проигран

class Application:
    created_by: ForeignKey(User)
    company: ForeignKey(CompanyProfile)
    
    product_type: CharField (ProductType.choices)
    amount: DecimalField(15,2)
    term_months: IntegerField
    
    # ⭐ ЦЕЛЕВОЙ БАНК (для маршрутизации Admin)
    target_bank_name: CharField(200)
    
    # Тендер (опционально)
    tender_number: CharField
    tender_platform: CharField
    tender_deadline: DateField
    
    status: CharField (ApplicationStatus.choices)
    assigned_partner: ForeignKey(User, role='partner')
    
    # Документы (M2M)
    documents: ManyToManyField(Document)
    
    # ЭЦП заглушка
    has_signature: BooleanField
    signature_file: FileField
    
    notes: TextField
    submitted_at: DateTimeField


class PartnerDecision:
    application: ForeignKey(Application)
    partner: ForeignKey(User)
    decision: CharField (approved/rejected/info_requested)
    comment: TextField
    offered_rate: DecimalField      # Предложенная ставка
    offered_amount: DecimalField    # Предложенная сумма
```

---

## 🔌 API ENDPOINTS (Django REST Framework)

### Аутентификация
```
POST /api/v1/auth/register/          # Регистрация (client/agent)
POST /api/v1/auth/login/             # Вход (JWT токены)
POST /api/v1/auth/token/refresh/     # Обновление токена
GET  /api/v1/auth/me/                # Текущий пользователь
```

### Компании
```
GET  /api/v1/companies/me/           # Профиль своей компании
PATCH /api/v1/companies/me/          # Обновить профиль
GET  /api/v1/companies/              # Список (по роли)
POST /api/v1/companies/              # Создать компанию

# CRM Клиенты (только Agent)
GET  /api/v1/crm-clients/            # Список CRM клиентов
POST /api/v1/crm-clients/            # Добавить CRM клиента
GET  /api/v1/crm-clients/{id}/       # Детали клиента
PATCH /api/v1/crm-clients/{id}/      # Обновить клиента
DELETE /api/v1/crm-clients/{id}/     # Удалить клиента
```

### Заявки
```
GET  /api/v1/applications/           # Список заявок (по роли)
POST /api/v1/applications/           # Создать заявку
GET  /api/v1/applications/{id}/      # Детали заявки
PATCH /api/v1/applications/{id}/     # Обновить черновик
DELETE /api/v1/applications/{id}/    # Удалить черновик

# Действия
POST /api/v1/applications/{id}/submit/   # Подать на рассмотрение
POST /api/v1/applications/{id}/assign/   # Назначить партнёру (Admin)
POST /api/v1/applications/{id}/decision/ # Решение партнёра

# Статистика
GET /api/v1/applications/stats/client/   # Статистика для клиента
```

### Документы
```
GET  /api/v1/documents/              # Библиотека документов
POST /api/v1/documents/              # Загрузить документ
GET  /api/v1/documents/{id}/         # Скачать документ
DELETE /api/v1/documents/{id}/       # Удалить документ
```

---

## 🎨 FRONTEND КОМПОНЕНТЫ

### AuthPage (components/auth/auth-page.tsx)
**Функционал:**
- Вкладки: Вход / Регистрация
- Выбор роли при регистрации (Клиент/Агент)
- ⭐ Кнопка "Вход по ЭЦП" (заглушка с toast "Скоро будет")
- JWT токены сохраняются в localStorage

### MyCompanyView (components/dashboard/my-company-view.tsx)
**Секции:**
1. **Общая информация:** ИНН, КПП, ОГРН, наименование
   - ⭐ Кнопка "Проверить на Checko.ru" → открывает checko.ru/company/{inn}
2. **Руководство:** ФИО директора, должность
   - ⭐ Поля паспорта: серия, номер, дата, код, кем выдан
3. **Банковские реквизиты:** БИК, р/с, к/с, банк
4. **Контактная информация:** телефон, email, контактное лицо

### CreateApplicationWizard (components/dashboard/create-application-wizard.tsx)
**Шаги:**
1. **Выбор продукта:** Банковская гарантия / Кредит / Факторинг / Лизинг
2. **Параметры:**
   - Компания (автовыбор для Client / выбор CRM клиента для Agent)
   - Сумма и срок
   - ⭐ Целевой банк (dropdown: Сбербанк, ВТБ, Альфа, etc.)
3. **Документы:**
   - ⭐ Выбор из библиотеки (checkbox) — НЕ загрузка!
   - Только если документа нет — кнопка "Загрузить"
4. **Подтверждение:** Итоговая сводка, кнопка "Отправить"

### AdminDashboard (components/dashboard/admin-dashboard.tsx)
**Функционал:**
- Таблица всех заявок (из API)
- ⭐ Колонка "Целевой банк" для маршрутизации
- Поиск по ID, клиенту, банку
- Кнопки: "Назначить" / "Отклонить"
- Подключен к реальному API (useApplications hook)

### PartnerApplicationDetail (components/dashboard/partner-application-detail.tsx)
**Вкладки:**
1. **Информация:** Тип продукта, сумма, срок
2. **Клиент:** Компания, ИНН, контакты
   - ⭐ Видит company_data с паспортом, учредителями, счетами
3. **Документы:** Список с кнопками скачивания

**Действия:**
- Одобрить (с комментарием и ставкой)
- Отклонить (обязательный комментарий)
- Запросить информацию

---

## 🔗 REACT HOOKS (Frontend API Layer)

### useMyCompany (hooks/use-companies.ts)
```typescript
const { company, isLoading, error, updateCompany, createCompany } = useMyCompany()
```

### useApplications (hooks/use-applications.ts)
```typescript
const { applications, isLoading, error, refetch } = useApplications()
```

### useApplication (hooks/use-applications.ts)
```typescript
const { application, isLoading, error } = useApplication(id)
// application.company_data содержит полные данные компании для Partner
```

### useCRMClients (hooks/use-companies.ts)
```typescript
const { clients, isLoading, error } = useCRMClients()
```

---

## 📦 СЕРИАЛИЗАТОРЫ (Backend)

### CompanyProfileSerializer
Поля: id, owner, is_crm_client, inn, kpp, ogrn, name, short_name,
legal_address, actual_address, director_name, director_position,
**passport_series, passport_number, passport_issued_by, passport_date, passport_code,
founders_data, bank_accounts_data,**
bank_name, bank_bic, bank_account, bank_corr_account,
contact_person, contact_phone, contact_email, website

### ApplicationSerializer
Поля: id, created_by, created_by_email, **created_by_name**, company, company_name, company_inn,
**company_data** (вложенный сериализатор для Partner),
product_type, product_type_display, amount, term_months, **target_bank_name**,
tender_number, tender_platform, tender_deadline, status, status_display,
assigned_partner, partner_email, document_ids, has_signature, notes,
decisions_count, created_at, updated_at, submitted_at

### CompanyDataForPartnerSerializer (вложенный)
Read-only данные компании для Partner/Bank:
- Все основные поля
- passport_* (паспорт директора)
- founders_data (учредители JSON)
- bank_accounts_data (счета JSON)
- contact_* (контакты)

---

## ✅ ЧТО РЕАЛИЗОВАНО (MVP Stage 1)

| Функционал | Статус | Файл |
|------------|--------|------|
| Регистрация Client/Agent | ✅ | auth-page.tsx |
| Вход по email/password | ✅ | auth-page.tsx |
| Кнопка "Вход по ЭЦП" (заглушка) | ✅ | auth-page.tsx |
| Профиль компании (CRUD) | ✅ | my-company-view.tsx |
| Паспортные данные директора | ✅ | models.py + serializers.py |
| Учредители (JSONField) | ✅ | models.py |
| Банковские счета (JSONField) | ✅ | models.py |
| Ссылка "Проверить на Checko.ru" | ✅ | my-company-view.tsx |
| CRM Клиенты для Agent | ✅ | clients-list-view.tsx |
| Создание заявки (Wizard) | ✅ | create-application-wizard.tsx |
| Выбор целевого банка | ✅ | create-application-wizard.tsx |
| Выбор документов из библиотеки | ✅ | create-application-wizard.tsx |
| Список заявок | ✅ | my-applications-view.tsx |
| Admin Dashboard + Target Bank | ✅ | admin-dashboard.tsx |
| Partner видит company_data | ✅ | serializers.py |
| Решения партнёра | ✅ | partner-application-detail.tsx |
| Удалены графики из Agent | ✅ | sidebar.tsx |

---

## 🚫 ЧТО НЕ РЕАЛИЗОВАНО (по ТЗ "Manual Mode Only")

- ❌ Реальные внешние API (ДаДата, ПроверкаКонтрагентов)
- ❌ Сложная аналитика и графики
- ❌ Реальная проверка ЭЦП
- ❌ Автоматическая маршрутизация заявок
- ❌ Email/SMS уведомления
- ❌ WebSocket чат (отложен)

---

## 🛠️ КОМАНДЫ ДЛЯ ЗАПУСКА

### Backend (Django)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend (Next.js)
```bash
npm install
npm run dev
```

### Docker (полный стек)
```bash
docker-compose up -d
```

---

## 🔧 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@localhost:5432/lidergarant
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 📝 ВАЖНЫЕ АРХИТЕКТУРНЫЕ РЕШЕНИЯ

### 1. JSONField для сложных структур
Вместо создания отдельных таблиц для учредителей и банковских счетов,
используются JSONField. Это упрощает MVP и позволяет быстро изменять структуру.

### 2. company_data в ApplicationSerializer
Partner/Bank получает полные данные компании вложенным объектом,
чтобы не делать дополнительных API запросов.

### 3. target_bank_name как CharField
Не ForeignKey на банки, а простой текст — для гибкости MVP.

### 4. Checkbox выбор документов
В мастере заявки документы не загружаются заново, а выбираются
из уже загруженной библиотеки пользователя.

### 5. Отсутствие графиков в Agent Dashboard
По требованию ТЗ "Manual Mode Only" — фокус на скорости работы,
а не на аналитике.

---

## 🐛 ИЗВЕСТНЫЕ ОСОБЕННОСТИ

1. **PostgreSQL обязателен** — SQLite не поддерживает JSONField корректно
2. **Миграции нужно запускать после pull** — поля могли добавиться
3. **CORS настроен на localhost:3000** — для продакшена изменить
4. **JWT токены в localStorage** — для продакшена рассмотреть httpOnly cookies

---

**Документ создан для передачи контекста другим разработчикам/AI.**
