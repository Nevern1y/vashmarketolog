# 🚀 DEPLOYMENT GUIDE: Financial Marketplace MVP + Audit Waves

**Version:** `1.1.0-audit-complete`  
**Last Update:** 2025-12-31  
**Django Status Model:** TextChoices (in code, no fixtures needed)

---

## 📋 PREREQUISITES

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (required for JSONField)
- Docker (recommended)

---

## 🐍 BACKEND (Django)

### Option A: Docker (Recommended)

```bash
cd backend
docker-compose up -d --build
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

### Option B: Local

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure database
cp .env.example .env
# Edit .env: DATABASE_URL=postgresql://user:pass@localhost:5432/finmarket

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start server
python manage.py runserver 0.0.0.0:8000
```

### Environment Variables (Backend)

| Variable | Example | Description |
|----------|---------|-------------|
| `SECRET_KEY` | `django-insecure-xxx` | Django secret |
| `DEBUG` | `False` | Production: False |
| `DATABASE_URL` | `postgresql://...` | DB connection |
| `ALLOWED_HOSTS` | `api.example.com` | Comma-separated |
| `CORS_ALLOWED_ORIGINS` | `https://app.example.com` | Frontend URL |

---

## ⚛️ FRONTEND (Next.js)

### Build

```bash
cd frontend  # or root directory
npm install
npm run build
npm run start  # Production server on port 3000
```

### Environment Variables (Frontend)

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

---

## 👤 INITIAL SETUP

1. **Login as Admin:**
   - Use credentials from `createsuperuser`
   - Access Admin Dashboard at `https://app.example.com`

2. **Invite Partner (Bank):**
   - Go to "Партнёры" tab
   - Click "Пригласить партнёра"
   - Copy invite link and send to bank manager

3. **Create Test Agent:**
   - Register new account with role "agent"

---

## ✅ HEALTH CHECKS

| Endpoint | Expected |
|----------|----------|
| `GET /api/health/` | `{"status": "ok"}` |
| `GET /api/applications/` | 200 + empty list |

---

## 📊 STATUS MODEL (in code, no fixtures)

```python
# backend/apps/applications/models.py
class ApplicationStatus(models.TextChoices):
    DRAFT = 'draft', 'Черновик'
    PENDING = 'pending', 'На рассмотрении'
    IN_REVIEW = 'in_review', 'В работе'
    INFO_REQUESTED = 'info_requested', 'Дозаполнение'
    APPROVED = 'approved', 'Одобрено'
    REJECTED = 'rejected', 'Отклонено'
    WON = 'won', 'Выигран'
    LOST = 'lost', 'Проигран'
```

No database seeding required - statuses are defined in code.

---

## 🎉 AUDIT WAVES COMPLETE (31.12.2024)

### What's New in v1.1.0:

**Wave 1: Calculator UX**
- ✅ Bank Selection Table with sorting (ready/rejected)
- ✅ Collapsible rejected banks with reasons
- ✅ "Лидер-Гарант" hardcoded row
- ✅ Multi-bank selection in application payload

**Wave 2: API Compliance**
- ✅ MCHD Signatory tab with conditional fields
- ✅ Employee count field
- ✅ Postal codes for all addresses
- ✅ Founder addresses (legal + actual)

**Wave 3: Partner Settings**
- ✅ Requisites tab (bank + tax info)
- ✅ Referrals tab (link + QR placeholder)
- ✅ Documents tab (download list)

---

## 📁 NEW COMPONENTS

| Component | Purpose |
|-----------|---------|
| `create-application-wizard.tsx` | Updated with Bank Selection Table (Step 3) |
| `edit-client-sheet.tsx` | 6 tabs including Signatory (MCHD) |
| `profile-settings-view.tsx` | **NEW** — Partner settings with 4 tabs |

---

## 📚 DOCUMENTATION

| File | Content |
|------|---------|
| `PROJECT_CONTEXT.md` | Full project context for AI/devs |
| `rules.md` | System prompt and coding rules |
| `technicheskoezadanie/` | All ТЗ files from Google Docs |
| `API_1.1.postman_collection...` | Реалист Банк API specification |
| `Приложения А, Б.pdf` | Bank status ID mappings |

---

## 🚧 PHASE 2 (FUTURE)

- Bank API integration (Realist Protocol)
- WebSocket chat
- Automated status updates from bank webhooks
- ЕГРЮЛ/ЕИС auto-fill by INN
- Real QR code generation
