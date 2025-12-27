# 🚀 DEPLOYMENT GUIDE: Financial Marketplace MVP Phase 1

**Version:** `1.0.0-manual-mode`  
**Django Status Model:** TextChoices (in code, no fixtures needed)

---

## 📋 PREREQUISITES

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (or SQLite for dev)
- Docker (optional)

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

## 🎉 PHASE 1 COMPLETE

This deployment represents **MVP Phase 1: Manual Mode**.

**What's Working:**
- ✅ Agent creates applications for CRM clients
- ✅ Admin reviews and assigns to Partners (Banks)
- ✅ Partner views full client data and makes decisions
- ✅ Real-time chat (polling-based)
- ✅ Document upload and management
- ✅ Mobile-responsive for all roles

**Phase 2 (Future):**
- Bank API integration (Realist Protocol)
- WebSocket chat
- Automated status updates
