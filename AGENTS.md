# AGENTS.md - Coding Agent Guidelines

## Project Overview

**Next.js 16 + Django REST Framework** financial marketplace (bank guarantees, loans).
Multi-role dashboard: Client, Agent, Partner, Admin.

**Architecture:** Backend (Django) = Source of Truth, Frontend (Next.js) = Visual Adapter

---

## Build/Lint/Run Commands

```bash
npm run dev          # Dev server http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm run start        # Production server

# Backend (from backend/)
python manage.py runserver 0.0.0.0:8000
python manage.py migrate

# Docker
docker-compose up -d   # PostgreSQL + Redis + MinIO
```

### Tests
No test framework configured. If added: `npx jest path/to/test.ts` or `npx vitest run path/to/test.ts`

---

## Code Style

### TypeScript
- **Strict mode ON** (`tsconfig.json`)
- Path alias: `@/*` → project root
- Target: ES6, moduleResolution: bundler

### Import Order
```typescript
"use client"  // Always first for client components

import { useState, useCallback } from 'react'           // 1. React
import { ChevronLeft, FileText } from 'lucide-react'    // 2. External libs
import { Button } from '@/components/ui/button'          // 3. UI components
import { useApplications } from '@/hooks/use-applications' // 4. Hooks
import { cn } from '@/lib/utils'                         // 5. Utils
import api, { type ApiError } from '@/lib/api'           // 6. API
import type { ViewType } from '@/lib/types'              // 7. Types (prefer `type` imports)
```

### Component Pattern
```typescript
interface ApplicationDetailViewProps {
    applicationId: string | number
    onBack?: () => void
}

export function ApplicationDetailView({ applicationId, onBack }: ApplicationDetailViewProps) {
    const [isUploading, setIsUploading] = useState(false)
    const { application, isLoading, error, refetch } = useApplication(applicationId)
    
    // Handlers: handle<Action> naming
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ...
    }, [])
}
```

### Naming Conventions
| Entity | Convention | Example |
|--------|------------|---------|
| Components | PascalCase | `ApplicationDetailView` |
| Files | kebab-case | `application-detail-view.tsx` |
| Hooks | `use` prefix | `useApplications` |
| Event handlers | `handle<Action>` | `handleFileUpload`, `handleSubmit` |
| Types/Interfaces | PascalCase | `ApplicationStatus` |
| Constants | SCREAMING_SNAKE | `STATUS_CONFIG` |

### Hooks Must Return
```typescript
return { data, isLoading, error, refetch }  // Standard shape
```

### Error Handling
```typescript
try {
    const response = await api.get<Application>(`/applications/${id}/`)
} catch (err) {
    const apiError = err as ApiError  // Always type-cast
    setError(apiError.message || 'Ошибка загрузки')
} finally {
    setIsLoading(false)  // Always in finally
}

// User feedback: toast from 'sonner'
toast.success('Заявка создана!')
toast.error('Ошибка', { description: 'Детали ошибки' })
```

### Forms (react-hook-form + zod)
```typescript
const schema = z.object({
    inn: z.string().min(10, 'ИНН: 10 или 12 цифр').max(12),
    employee_count: z.coerce.number().optional(),  // coerce for number inputs
})
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

### Styling
```typescript
import { cn } from '@/lib/utils'
<div className={cn("base-classes", isActive && "active-classes")} />
// Colors: #0a1628 (bg), #3CE8D1 (primary cyan), use opacity: bg-[#3CE8D1]/10
```

---

## Critical Rules

### 1. Status Mapping (NEVER use switch-case)
```typescript
import { getStatusConfig } from '@/lib/status-mapping'
const config = getStatusConfig(status)  // { step, label, color, bgColor }
```

### 2. API Client
```typescript
import api from '@/lib/api'
await api.get<T>(endpoint, params)       // GET
await api.post<T>(endpoint, data)        // POST
await api.patch<T>(endpoint, data)       // PATCH
await api.uploadWithProgress(endpoint, formData, onProgress)  // Files
```

### 3. Dialogs & Toasts
```typescript
// ✅ Use shadcn/ui AlertDialog, NOT window.confirm()
// ✅ Use toast from 'sonner', NOT window.alert()
```

### 4. Auth Context
```typescript
import { useAuth } from '@/lib/auth-context'
const { user, isLoading, isAuthenticated, login, logout } = useAuth()
```

---

## Project Structure

```
/app                    # Next.js App Router
/components
  /dashboard            # View components
  /ui                   # shadcn/ui primitives
/hooks                  # use-applications.ts, use-documents.ts
/lib
  api.ts                # HTTP client with JWT
  auth-context.tsx      # Auth provider
  status-mapping.ts     # Status → visual config (CRITICAL)
  types.ts              # ViewType, AppMode
  utils.ts              # cn(), formatPhoneNumber()
```

---

## Do's and Don'ts

| DO | DON'T |
|----|-------|
| Use `lib/status-mapping.ts` for status | Write switch-case for status |
| Use `api` from `@/lib/api` | Use raw fetch() |
| Use `AlertDialog` from shadcn/ui | Use `window.confirm()` |
| Use `toast` from sonner | Use `window.alert()` |
| Use `cn()` for class merging | String concatenation |
| Add `"use client"` for client components | Forget the directive |
| Return `null` on mutation error | Throw errors from mutations |

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/status-mapping.ts` | Status → visual config |
| `lib/api.ts` | HTTP client, JWT, refresh |
| `lib/auth-context.tsx` | Auth state |
| `hooks/use-applications.ts` | Application CRUD |

---

## Environment

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Documentation

- `/technicheskoezadanie/rules.md` - System prompt
- `/technicheskoezadanie/PROJECT_CONTEXT.md` - Project context

---

## Library Documentation Search

When you need to search documentation for libraries (Next.js, React, Zod, etc.), use `context7` tools:

```
1. context7_resolve-library-id  → Get library ID (e.g., "next.js" → "/vercel/next.js")
2. context7_query-docs          → Query docs with the library ID
```

Example: To find Next.js App Router docs, first resolve "next.js", then query with the returned ID.

---

## MCP (Model Context Protocol) Integration

This project uses MCP servers for enhanced AI capabilities with direct access to project infrastructure.

### Available MCP Servers

| Server | Purpose | Connection | OpenCode Status |
|---------|---------|------------|-----------------|
| `postgres` | Direct PostgreSQL database access | `postgres://postgres:postgres@localhost:5432/lider_garant` | ✅ Available |
| `github` | GitHub integration (PRs, issues) | GitHub Personal Access Token | ✅ Available |
| `redis` | Redis cache management | `redis://localhost:6379` | ✅ Available |
| `docker` | Docker container management | Docker CLI | ✅ Available |
| `sentry` | Error monitoring | Sentry Auth Token | ✅ Available |
| `memory` | Persistent knowledge graph | Local storage | ✅ Available |
| `think` | Enhanced reasoning capabilities | Local | ✅ Available |
| `openapi` | REST API testing via OpenAPI spec | `http://localhost:8000/api/schema/` | ⚠️ May not load in OpenCode |
| `puppeteer` | Browser automation | Chromium | ⚠️ May not load in OpenCode |
| `filestash` | MinIO S3 file access | MinIO S3 endpoint (Docker) | ⚠️ May not load in OpenCode |
| `django-rest` | Django REST Framework integration | `http://localhost:8000/mcp/` (via mcp-remote) | ⚠️ May not load in OpenCode |

**Note:** OpenCode typically loads 5-7 MCP servers due to resource constraints. The core infrastructure servers (postgres, redis, github, docker, sentry, memory, think) should be available reliably. Optional/additional servers (openapi, puppeteer, filestash, django-rest) may not load due to timeouts, resource limits, network issues, or dependency requirements.

### Configuration Files

- `mcp.json` - MCP server configurations (in project root)
- `.env.mcp` - Environment variables for MCP (GitHub token, Sentry token, DB URLs)
- `.gitignore` - Includes `.env.mcp` and `mcp.json` for security

### MCP Usage Examples

#### Database Operations
```
Query PostgreSQL directly:
SELECT id, status, created_at FROM applications ORDER BY created_at DESC LIMIT 10;
```

#### Cache Management
```
Check Redis cache:
KEYS *
GET session:123
```

#### Docker Management
```
List containers: docker ps
View logs: docker logs lider_garant_backend --tail 50
Restart service: docker-compose restart backend
```

#### Error Monitoring
```
View recent errors from Sentry: Show errors from last 24 hours
Check performance metrics: Show performance data
```

#### API Testing
```
Test Django REST endpoint: Call GET /api/applications/
Create new application: Call POST /api/applications/ with data {...}
```

#### GitHub Integration
```
List open PRs: List pull requests
Create issue: Create issue with title "Bug: application status not updating"
```

#### Memory Persistence
```
Remember architecture: Remember that frontend uses Next.js 16 with App Router
Recall: What is the database schema for applications?
```

### MCP Endpoints & Services

- **PostgreSQL:** `postgres://postgres:postgres@localhost:5432/lider_garant`
- **Redis:** `redis://localhost:6379`
- **Django API:** `http://localhost:8000/api`
- **Django MCP:** `http://localhost:8000/mcp/` (requires mcp-remote)
- **MinIO:** `http://localhost:9000` (console: `http://localhost:9001`)
- **OpenAPI Schema:** `http://localhost:8000/api/schema/`
- **Swagger UI:** `http://localhost:8000/api/docs/`

### Troubleshooting MCP

#### Understanding OpenCode MCP Loading Behavior

**Expected:** You may see 5-7 MCP servers in `/mcp` command

**Reason:** OpenCode may not load all servers due to:
- Resource constraints (browser automation requires Chromium download)
- Network restrictions (MinIO/Filestash via Docker)
- Dependency issues (OpenAPI/Django REST require running services)
- Timeout limits (large packages may not load in time on first use)

### Core Infrastructure Servers (Should Always Load)

| Server | Status | Notes |
|---------|--------|-------|
| `postgres` | ✅ Core infrastructure | Direct DB access, should always load |
| `redis` | ✅ Core infrastructure | Cache operations, should always load |
| `github` | ✅ Core infrastructure | Token configured, should always load |
| `docker` | ✅ Core infrastructure | Container management, should always load |
| `sentry` | ✅ Core infrastructure | Token configured, should always load |
| `memory` | ✅ Core infrastructure | Knowledge persistence, should always load |
| `think` | ✅ Core infrastructure | Enhanced reasoning, should always load |

### Optional/Additional Servers (May Not Load)

| Server | Status | Why May Not Load |
|---------|--------|-----------------|
| `openapi` | ⚠️ API testing | May require additional config or dependencies |
| `puppeteer` | ⚠️ Browser automation | Chromium download may timeout on first load |
| `filestash` | ⚠️ MinIO access | Docker container may conflict on Windows |
| `django-rest` | ⚠️ Django integration | Depends on backend health, may fail if backend not responding |

**Note:** If optional servers don't load, it's expected. Focus on using core infrastructure servers (postgres, redis, github, docker, sentry, memory, think).

### Verifying MCP Servers in OpenCode

Use `/mcp` command in OpenCode to check server status:
- OpenCode Settings → MCP Servers (or Extensions section)
- Shows all available servers with status indicators
- Green checkmark = loaded successfully
- Red X = failed to load

### Testing MCP Functionality in OpenCode

**Database Operations:**
```
Query PostgreSQL: "Show me the last 5 applications from the database"
Expected result: MCP postgres server should execute query
```

**Cache Management:**
```
Check Redis: "List all Redis keys"
Expected result: MCP redis server should return keys
```

**GitHub Integration:**
```
List Pull Requests: "Show me open pull requests"
Expected result: MCP github server should list PRs
```

**Docker Management:**
```
List Containers: "Show me running Docker containers"
Expected result: MCP docker server should list containers
```

**Error Monitoring:**
```
View Sentry Errors: "Show me errors from last 24 hours"
Expected result: MCP sentry server should return error data
```

**Knowledge Persistence:**
```
Remember: "Remember that the database is PostgreSQL and cache is Redis"
Expected result: MCP memory server should store information
```

**Enhanced Reasoning:**
```
Analyze: "Analyze current project architecture and suggest improvements"
Expected result: MCP think server should provide analysis
```

### Troubleshooting Common Issues

**Issue:** PostgreSQL connection fails
```bash
# Check DB container
docker ps | grep lider_garant_db

# Test connection
docker exec -it lider_garant_db psql -U postgres -d lider_garant -c "SELECT 1;"

# Restart DB if needed
docker-compose restart db
```

**Issue:** Redis not accessible
```bash
# Check Redis container
docker ps | grep lider_garant_redis

# Test connection
docker exec -it lider_garant_redis redis-cli ping

# Should return: PONG
```

**Issue:** Django REST MCP not working
```bash
# Check backend logs
docker logs lider_garant_backend --tail 50

# Restart backend
docker-compose restart backend

# Verify MCP endpoint
curl -X POST http://localhost:8000/mcp/ -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"initialize","id":1}'
```

Expected response: `{"jsonrpc":"2.0","result":{"protocolVersion":"2025-06-18","serverInfo":{...}},"id":1}`

**Issue:** MCP servers timeout on first load
**Solution:** Normal behavior. Large packages may take 30+ seconds to download on first use. Try again in a moment.

### MCP Documentation

- `MCP_README.md` - Comprehensive MCP usage guide
- `MCP_QUICK_REFERENCE.md` - Quick command reference
- `MCP_INSTALLATION_COMPLETE.md` - Installation report and configuration details
- `MCP_HEALTH_CHECK.md` - Health check report

### Backend MCP Integration

The Django backend includes `djangorestframework-mcp` package which exposes DRF ViewSets as MCP tools:

- Added to `INSTALLED_APPS` in `backend/config/settings/base.py`
- MCP endpoint added to `backend/config/urls.py` at `/mcp/`
- Requires `mcp-remote` bridge for HTTP transport
- All ViewSets with `@mcp_viewset()` decorator are automatically exposed

### MCP Server Setup Status

✅ **All 11 MCP servers installed and configured on 2026-01-16**

Configuration includes:
- GitHub Personal Access Token for repository operations
- Sentry Auth Token for error monitoring
- Database credentials for PostgreSQL access
- Redis connection for cache management
- MinIO credentials for file storage access
- Docker CLI integration for container management
- Django REST API integration via HTTP MCP endpoint

All core infrastructure servers are ready to use. Restart OpenCode to load configuration. Optional servers may or may not load depending on system resources and constraints.
