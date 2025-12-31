# 📋 LIDER GARANT: SaaS Financial Marketplace

**Последнее обновление:** 2025-12-31T03:08  
**Статус:** MVP Stage 1 — **ГОТОВ + АУДИТ ВОЛН 1-3** ✅  
**Архитектура:** API-Ready + Manual Mode + **Adapter Pattern**

---

## 🛡️ АРХИТЕКТУРНЫЙ ЗАКОН (THE ADAPTER LAW)

### Phase 1 vs Phase 2
| Компонент | Phase 1 (Сейчас) | Phase 2 (Будущее) |
|-----------|------------------|-------------------|
| Статусы | Текстовые: `draft`, `pending`, `in_review` | Числовые ID: 101, 110, 210 |
| Документы | `status`: pending/verified/rejected | `is_loaded`, `product_document_id` |
| API Банков | ❌ Не используем | ✅ Реалист Банк API 1.1 |

### Правило Адаптера
```
Backend (Django) = SOURCE OF TRUTH
├── Статусы: draft, pending, in_review, approved, rejected, won
├── Документы: status, file, name
└── НЕ МЕНЯТЬ под ID из PDF

Frontend (Next.js) = VISUAL ADAPTER
├── lib/status-mapping.ts = Централизованный маппинг
├── STATUS_CONFIG: Django → Step + Label + Colors
├── BANK_STATUS_CONFIG: Bank ID → Label (из Приложения А, Б)
└── STEPPER_LABELS: ["Черновик", "На проверке", "Решение", "Выпущена"]
```

---

## 🔥 ПОСЛЕДНИЙ АУДИТ (31.12.2024) — 3 ВОЛНЫ ЗАВЕРШЕНЫ

### Волна 1: Калькулятор (Bank Selection) ✅
| Компонент | Статус |
|-----------|--------|
| Таблица банков с сортировкой (готовы/отказ) | ✅ Реализовано |
| Collapsible отказники с причиной | ✅ Реализовано |
| Hardcoded строка "Лидер-Гарант" | ✅ Реализовано |
| Multi-select банков в payload | ✅ Реализовано |

### Волна 2: API Compliance (Client Form) ✅
| Компонент | Статус |
|-----------|--------|
| Поле `employee_count` | ✅ Реализовано |
| Вкладка "Подписант" (MCHD) | ✅ Реализовано |
| Адреса учредителей + индексы | ✅ Реализовано |
| Postal codes для 3 типов адресов | ✅ Реализовано |

### Волна 3: Кабинет (Settings) ✅
| Компонент | Статус |
|-----------|--------|
| Вкладка "Реквизиты" (БИК, Р/С, НДС) | ✅ Реализовано |
| Вкладка "Рефералы" + QR + Copy | ✅ Реализовано |
| Вкладка "Документы" | ✅ Реализовано |

---

## 🏗️ ТЕХНИЧЕСКИЙ СТЕК

| Слой | Технология |
|------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Django 4.2+, Django REST Framework |
| Database | **PostgreSQL** (JSONField обязателен) |
| Auth | JWT (SimpleJWT) |
| Storage | MinIO (S3-compatible) |
| Container | Docker Compose |

---

## 📁 СТРУКТУРА ПРОЕКТА

```
d:\New folder\dashboarddesignanalysis\
├── backend/                          # Django REST Framework API
│   ├── apps/
│   │   ├── users/                    # 4 роли пользователей
│   │   ├── companies/                # CompanyProfile + паспорт + учредители
│   │   ├── applications/             # Заявки + TicketMessage (чат)
│   │   └── documents/                # Загрузка файлов
│   └── manage.py
│
├── app/                              # Next.js 14 (App Router)
│   └── page.tsx                      # Роутинг по ролям
│
├── components/dashboard/
│   ├── admin-dashboard.tsx           # Premium UI (Pro Data Grid + Drawer)
│   ├── application-detail-view.tsx   # Детали заявки (uses status-mapping.ts)
│   ├── create-application-wizard.tsx # Wizard + Bank Selection Table (Wave 1)
│   ├── edit-client-sheet.tsx         # 6 вкладок + MCHD Signatory (Wave 2)
│   ├── profile-settings-view.tsx     # Реквизиты/Рефералы/Документы (Wave 3)
│   ├── my-company-view.tsx           # Профиль компании + паспорт
│   └── partner-layout.tsx            # Container для Partner Dashboard
│
├── lib/
│   ├── api.ts                        # HTTP клиент (baseURL: localhost:8000/api)
│   ├── auth-context.tsx              # JWT Auth
│   └── status-mapping.ts             # 🔴 ЦЕНТРАЛИЗОВАННЫЙ МАППИНГ СТАТУСОВ
│
├── hooks/
│   ├── use-applications.ts           # Заявки + ApplicationDocument
│   ├── use-companies.ts              # Компании
│   └── use-documents.ts              # Документы
│
├── technicheskoezadanie/             # 📚 ТЗ ДОКУМЕНТАЦИЯ
│   ├── API_1.1.postman_collection... # Реалист Банк API (add_ticket)
│   ├── Приложения А, Б (2) (1).pdf   # Справочники статусов банка
│   └── *.txt                         # Текстовые ТЗ из Google Docs
│
└── docker-compose.yml                # PostgreSQL + MinIO + Redis
```

---

## 🔄 API МАППИНГ (Postman API 1.1)

### Структура `add_ticket` (создание заявки в банк)

```json
{
  "ticket": {
    "product_id": 1,           // 1=БГ, 2=КИК
    "bg": { "sum", "type_id", "start_at", "end_at" },
    "kik": { "sum", "type_id" }
  },
  "goscontract": {
    "purchase_number", "subject", "contract_number",
    "is_close_auction", "is_single_supplier"
  },
  "client": {
    "inn", "employee_count", "website",
    "actual_address": { "value", "postal_code" },
    "post_address": { "value", "postal_code" },
    "is_mchd", "mchd_full_name", "mchd_inn", "mchd_number", "mchd_date",
    "founders": [{ "full_name", "inn", "share_relative", "document", "legal_address", "actual_address" }]
  },
  "beneficiary": { "inn", "legal_address" }
}
```

---

## 👥 СИСТЕМА РОЛЕЙ (4 РОЛИ)

| Роль | Права |
|------|-------|
| **CLIENT** | Заполняет свою компанию, подаёт заявки, загружает документы |
| **AGENT** | CRM клиентов, создаёт заявки **от имени клиентов** |
| **PARTNER** | Видит ТОЛЬКО назначенные заявки + полные данные (включая паспорт) |
| **ADMIN** | Видит ВСЕ заявки, назначает партнёров |

---

## 🗄️ КЛЮЧЕВЫЕ МОДЕЛИ

### CompanyProfile (apps/companies/models.py) — WAVE 2 UPDATED
```python
# Идентификация
inn, kpp, ogrn, name, short_name
legal_address, actual_address, post_address
legal_address_postal_code, actual_address_postal_code, post_address_postal_code  # WAVE 2

# Сотрудники
employee_count  # WAVE 2

# Подписант (MCHD) — WAVE 2
signatory_basis  # "charter" | "power_of_attorney"
is_mchd, mchd_full_name, mchd_inn, mchd_number, mchd_date

# JSONField для структур
founders_data       # + legal_address, actual_address, postal_codes (WAVE 2)
bank_accounts_data  # [{bank_name, bank_bik, account}]
```

### Application (apps/applications/models.py) — WAVE 1 UPDATED
```python
product_type: Enum (bank_guarantee, tender_loan, factoring, leasing)
amount: DecimalField(15,2)
term_months: IntegerField
selected_banks: JSONField  # WAVE 1 — массив выбранных банков
status: Enum (draft → pending → in_review → approved/rejected → won/lost)
assigned_partner: FK(User)
documents: M2M(Document)
```

---

## ✅ РЕАЛИЗОВАННЫЙ ФУНКЦИОНАЛ (MVсP + Audit Waves)

| Функционал | Статус | Файл |
|------------|--------|------|
| Централизованный маппинг статусов | ✅ | lib/status-mapping.ts |
| Регистрация Client/Agent | ✅ | auth-page.tsx |
| Профиль компании + Паспорт | ✅ | my-company-view.tsx |
| CRM Клиенты + Паспорт | ✅ | edit-client-sheet.tsx |
| **Bank Selection Table (WAVE 1)** | ✅ | create-application-wizard.tsx |
| **Collapsible отказники (WAVE 1)** | ✅ | create-application-wizard.tsx |
| **MCHD Подписант (WAVE 2)** | ✅ | edit-client-sheet.tsx |
| **Адреса учредителей (WAVE 2)** | ✅ | edit-client-sheet.tsx |
| **Настройки партнера (WAVE 3)** | ✅ | profile-settings-view.tsx |
| Admin Dashboard | ✅ | admin-dashboard.tsx |
| Partner видит company_data | ✅ | serializers.py |
| Чат в заявках | ✅ | application-chat.tsx |

---

## 🚀 КАК ЗАПУСТИТЬ

```bash
# 1. Docker (PostgreSQL + Redis + MinIO)
docker-compose up -d

# 2. Django Backend
cd backend && python manage.py runserver 0.0.0.0:8000

# 3. Next.js Frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000/api/

---

## 📋 QUICK START ДЛЯ НОВОГО ЧАТА

```
Проект: LIDER GARANT — SaaS Financial Marketplace
Путь: d:\New folder\dashboarddesignanalysis
Стек: Django REST + Next.js 14 + PostgreSQL (Docker)
Статус: MVP Stage 1 ГОТОВ + АУДИТ 3 ВОЛН ✅
Архитектура: Adapter Pattern (Backend=Truth, Frontend=Adapter)

КЛЮЧЕВЫЕ ФАЙЛЫ:
- lib/status-mapping.ts — Маппинг статусов + банков
- create-application-wizard.tsx — Bank Selection Table
- edit-client-sheet.tsx — 6 вкладок + MCHD
- profile-settings-view.tsx — Реквизиты + Рефералы

ДОКУМЕНТАЦИЯ:
- technicheskoezadanie/ — Все ТЗ (txt) + API Postman
- Приложения А, Б.pdf — Справочники банка

ЗАПУСК:
1. Docker Desktop → docker-compose up -d
2. cd backend && python manage.py runserver
3. npm run dev

ВАЖНО:
- НЕ использовать Mock-данные
- НЕ менять Backend под числовые ID из PDF (Phase 2)
- Использовать lib/status-mapping.ts для визуального маппинга
- PostgreSQL обязателен (JSONField)
```

---

**Документ создан для передачи контекста другим разработчикам/AI.**  
**Последний аудит:** Все 3 волны ТЗ закрыты (31.12.2024)
