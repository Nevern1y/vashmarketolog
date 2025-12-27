# 📋 LIDER GARANT: SaaS Financial Marketplace

**Последнее обновление:** 2025-12-28T03:38  
**Статус:** MVP Stage 1 — **ГОТОВ** ✅  
**Архитектура:** API-Ready + Manual Mode + **Adapter Pattern**

---

## 🛡️ АРХИТЕКТУРНЫЙ ЗАКОН (THE ADAPTER LAW)

### Phase 1 vs Phase 2
| Компонент | Phase 1 (Сейчас) | Phase 2 (Будущее) |
|-----------|------------------|-------------------|
| Статусы | Текстовые: `draft`, `pending`, `in_review` | Числовые ID: 101, 110, 210 |
| Документы | `status`: pending/verified/rejected | `is_loaded`, `product_document_id` |
| API Банков | ❌ Не используем | ✅ Реалист Банк и др. |

### Правило Адаптера
```
Backend (Django) = SOURCE OF TRUTH
├── Статусы: draft, pending, in_review, approved, rejected, won
├── Документы: status, file, name
└── НЕ МЕНЯТЬ под ID из PDF

Frontend (Next.js) = VISUAL ADAPTER
├── lib/status-mapping.ts = Централизованный маппинг
├── STATUS_CONFIG: Django → Step + Label + Colors
├── DOC_STATUS_CONFIG: Document → Icon + Colors
└── STEPPER_LABELS: ["Черновик", "На проверке", "Решение", "Выпущена"]
```

### Фаза 1: Ручной режим
1. **Никаких внешних интеграций:** НЕ подключаем API банков, ФНС, DaData или ЭЦП
2. **СТРОГО ЗАПРЕЩЕНЫ Mock-данные:** Весь Frontend работает с реальным API Django
3. **Заглушки:** Разрешены ТОЛЬКО для Фазы 2 (кнопка "Вход по ЭЦП", "Отправить в банк")

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
│   ├── partner-layout.tsx            # Container для Partner Dashboard
│   ├── my-company-view.tsx           # Профиль компании + паспорт
│   ├── edit-client-sheet.tsx         # View/Edit режимы клиента + паспорт
│   └── create-application-wizard.tsx # Мастер создания заявки
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
└── docker-compose.yml                # PostgreSQL + MinIO + Redis
```

---

## 🔄 LIB/STATUS-MAPPING.TS (Ключевой файл)

Централизованный маппинг Django → Visual TOR:

```typescript
// Django Status → Visual Step
STATUS_CONFIG = {
  draft:         { step: 0, label: 'Черновик',        stepLabel: 'Анкета' },
  pending:       { step: 1, label: 'На рассмотрении', stepLabel: 'Прескоринг' },
  in_review:     { step: 1, label: 'В работе',        stepLabel: 'Проверка документов' },
  info_requested:{ step: 1, label: 'Дозаполнение',    stepLabel: 'Запрос информации' },
  approved:      { step: 2, label: 'Одобрено',        stepLabel: 'Одобрено' },
  rejected:      { step: 2, label: 'Отклонено',       stepLabel: 'Отклонено', isNegative: true },
  won:           { step: 3, label: 'Выигран',         stepLabel: 'Выпущена' },
  lost:          { step: 3, label: 'Проигран',        stepLabel: 'Проигран', isNegative: true },
}

// Document Type ID → Label (Phase 2 preparation)
DOCUMENT_TYPE_LABELS = {
  17: 'Заявление',
  20: 'Бухгалтерская отчетность (Ф1, Ф2)',
  21: 'Паспорт генерального директора',
  30: 'Налоговая декларация',
  75: 'Устав',
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

### CompanyProfile (apps/companies/models.py)
```python
# Идентификация
inn, kpp, ogrn, name, short_name
legal_address, actual_address
director_name, director_position

# Паспорт директора (API-Ready)
passport_series, passport_number, passport_issued_by, passport_date, passport_code

# JSONField для сложных структур
founders_data       # [{name, inn, share}]
bank_accounts_data  # [{account, bic, bank_name}]

# CRM
is_crm_client: Boolean  # True = клиент агента
owner: FK(User)         # Владелец
```

### Application (apps/applications/models.py)
```python
product_type: Enum (bank_guarantee, tender_loan, factoring, leasing)
amount: DecimalField(15,2)
term_months: IntegerField
target_bank_name: CharField    # Для маршрутизации Admin
status: Enum (draft → pending → in_review → approved/rejected → won/lost)
assigned_partner: FK(User)
documents: M2M(Document)       # Вложенные через ApplicationDocumentSerializer
created_by: FK(User)
company: FK(CompanyProfile)
```

### Document (apps/documents/models.py)
```python
owner: FK(User)
company: FK(CompanyProfile) optional
name, file, document_type
status: Enum (pending, verified, rejected)
```

---

## ✅ РЕАЛИЗОВАННЫЙ ФУНКЦИОНАЛ (MVP Stage 1)

| Функционал | Статус | Файл |
|------------|--------|------|
| Централизованный маппинг статусов | ✅ | lib/status-mapping.ts |
| Регистрация Client/Agent | ✅ | auth-page.tsx |
| Кнопка "Вход по ЭЦП" (заглушка) | ✅ | auth-page.tsx |
| Профиль компании + Паспорт | ✅ | my-company-view.tsx |
| CRM Клиенты + Паспорт | ✅ | edit-client-sheet.tsx |
| Создание заявки (Wizard) | ✅ | create-application-wizard.tsx |
| Детали заявки (без моков) | ✅ | application-detail-view.tsx |
| Admin Dashboard | ✅ | admin-dashboard.tsx |
| Partner видит company_data | ✅ | serializers.py |
| Динамический badge Partner | ✅ | partner-layout.tsx |
| Чат в заявках | ✅ | application-chat.tsx |

---

## 🔧 ПОСЛЕДНИЕ ИСПРАВЛЕНИЯ (28.12.2025)

### Глобальный Аудит Phase 1
| Задача | Результат |
|--------|-----------|
| Создан `lib/status-mapping.ts` | ✅ Центральный маппинг Django→Visual |
| `application-detail-view.tsx` рефакторинг | ✅ Убраны все моки, импорт из status-mapping |
| `ApplicationSerializer` обновлён | ✅ Вложенные `documents[]` с status/file_url |
| Проверен `admin-dashboard.tsx` | ✅ Реальный API |
| Проверен `partner-layout.tsx` | ✅ Реальный badge из useApplications() |
| Проверен `my-company-view.tsx` | ✅ Паспортные поля + PATCH |
| Проверен `edit-client-sheet.tsx` | ✅ Паспортные поля + PATCH |

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
Статус: MVP Stage 1 ГОТОВ ✅
Архитектура: Adapter Pattern (Backend=Truth, Frontend=Adapter)

КЛЮЧЕВОЙ ФАЙЛ: lib/status-mapping.ts
- Маппинг Django статусов → Visual Steps
- Маппинг Document Types → Labels
- ОБЯЗАТЕЛЬНО использовать во всех компонентах

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
