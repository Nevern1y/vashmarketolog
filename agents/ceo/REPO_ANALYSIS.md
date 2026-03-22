# Lider Garant Repository Analysis

## Status

- Analysis is based on repository files plus local runtime checks.
- Backend runtime inspection is currently blocked: `docker-compose ps` shows no running services, and `http://localhost:8000/mcp/` plus `http://localhost:8000/api/schema/` are unreachable.
- Paperclip issue sync is partially blocked because `LIDA-1` is already `in_progress` with no `checkoutRunId`, so agent comment/update calls conflict with current run ownership state.

## Phase 1 - Codebase Cartography

### Architecture And Structure

- The repo is a 3-app monorepo: Cabinet at the root, Landing in `lider-garant`, Backend in `backend` (`AGENTS.md:4`, `AGENTS.md:9`).
- Cabinet route entry points live in `app`, shared UI in `components`, hooks in `hooks`, and helper layers in `lib` (`AGENTS.md:28`, `AGENTS.md:35`).
- Cabinet is a role-aware authenticated app: `app/layout.tsx:35` wraps the app in `AuthProvider`, and `app/page.tsx:160` selects admin, agent, client, and partner views.
- Landing is a separate public Next app with SEO-oriented routing in `lider-garant/src/app/[...slug]/page.tsx:66` and a small SEO manager surface in `lider-garant/src/app/seo-manager`.
- Backend domain boundaries are explicit in `backend/apps`, with `users`, `companies`, `applications`, `documents`, `chat`, `bank_conditions`, `notifications`, `news`, and `seo` all registered in `backend/config/settings/base.py:46`.
- Backend URL composition is centralized in `backend/config/urls.py:14`, which mounts `/api/auth/`, `/api/companies/`, `/api/documents/`, `/api/applications/`, `/api/chat/`, `/api/news/`, `/api/bank-conditions/`, `/api/seo/`, `/api/notifications/`, and `/mcp/`.

### Patterns And Conventions

- Root TS path alias is `@/* -> ./*` in `tsconfig.json:25`; Landing uses `@/* -> ./src/*` in `lider-garant/tsconfig.json:21`.
- Repo guidance prefers `react-hook-form` + `zod` + `zodResolver`, shared API clients, shared auth contexts, `toast` from `sonner`, and `AlertDialog` for destructive flows (`AGENTS.md:118`, `AGENTS.md:151`).
- Cabinet API access is centralized in `lib/api.ts:17`; Landing mirrors that in `lider-garant/src/lib/api.ts:17`.
- Cabinet auth is centralized in `lib/auth-context.tsx:42`; Landing mirrors the pattern in `lider-garant/src/lib/auth-context.tsx:33`.
- Shared Cabinet status logic lives in `lib/status-mapping.ts:15` and `lib/application-statuses.ts:14`.
- Shared Cabinet document catalogs and matching helpers live in `lib/document-types.ts:14` and `lib/bank-document-requirements.ts:14`.
- Realtime chat infrastructure exists in backend Channels files `backend/config/asgi.py:21`, `backend/apps/chat/routing.py:8`, and `backend/apps/chat/consumers.py:14`, while frontend chat hooks live in `hooks/use-chat.ts:278` and `hooks/use-chat-threads.ts:56`.

### Stack And Dependencies

- Cabinet uses Next 16, React 19, `axios`, `react-hook-form`, `zod`, `sonner`, Radix primitives, and Recharts (`package.json:11`, `package.json:89`).
- Landing also uses Next 16 and React 19, but its UI stack adds Framer Motion, Lottie, and Swiper (`lider-garant/package.json:11`, `lider-garant/package.json:50`).
- Backend requirements include Django 5, DRF, SimpleJWT, Channels, channels-redis, Daphne, drf-spectacular, django-filter, whitenoise, and psycopg2 (`backend/requirements.txt:3`, `backend/requirements.txt:21`).
- Backend settings define PostgreSQL, JWT auth, DRF pagination, CORS, static/media, custom user model, Channels, and schema tooling in `backend/config/settings/base.py:118`.
- Dev settings use console email and in-memory Channels in `backend/config/settings/development.py:6`; prod switches to Redis-backed Channels and hardened cookie/security settings in `backend/config/settings/production.py:12`.

### Existing Abstractions

- Shared form wrappers live in `components/ui/form.tsx:19`.
- Shared class merge helpers live in `lib/utils.ts:1` and `lider-garant/src/lib/utils.ts:1`.
- Cabinet domain hooks cover companies, applications, documents, chat, notifications, bank conditions, and news in `hooks/use-companies.ts`, `hooks/use-applications.ts`, `hooks/use-documents.ts`, `hooks/use-chat.ts`, `hooks/use-notifications.ts`, `hooks/use-bank-conditions.ts`, and `hooks/use-news.ts`.
- Backend permissions are centralized in `backend/apps/users/permissions.py:7`.
- Backend validation is serializer-first across domain apps, consistent with repo instructions in `AGENTS.md:133`.

## Phase 2 - Functional Context

### Dependency Graph

- Both frontends depend on backend REST contracts through shared API clients rather than ad hoc endpoint code (`lib/api.ts:17`, `lider-garant/src/lib/api.ts:17`).
- Cabinet owns the richer operational flows: auth, company profiles, applications, documents, notifications, and chat are all represented by dedicated hooks and dashboard components.
- Landing is lighter and public-facing: SEO page rendering is handled by `lider-garant/src/lib/seo-api.ts:109`, while public lead submission is handled by `lider-garant/src/lib/leads.ts:130`.
- Nginx confirms production routing boundaries: public domain serves Landing, cabinet subdomain serves Cabinet, and `/api/` plus `/ws/` route to Django (`nginx/nginx.conf:77`, `nginx/nginx.conf:224`).

### Data Flow

- Backend remains the source of truth: requests enter URL modules, pass through DRF views/viewsets and serializers, persist via Django models, and return structured API payloads.
- `users` centers on a custom email-based user model with role scoping in `backend/apps/users/models.py:14`.
- `companies` centers on `CompanyProfile` with substantial JSON-backed structured sections in `backend/apps/companies/models.py:12`.
- `applications` is the core business domain for product catalog, assignments, states, calculation sessions, partner decisions, chat linkage, and public leads in `backend/apps/applications/models.py:9`.
- `documents` stores reusable document records and application-linked requirements in `backend/apps/documents/models.py:16`.
- `seo` stores page templates, metadata, FAQ/search data, and publish state in `backend/apps/seo/models.py:4`.

### Business Logic

- User roles include `client`, `agent`, `partner`, `admin`, and `seo` in `backend/apps/users/models.py:29`.
- Cabinet role-to-dashboard behavior is visible in `app/page.tsx:160`.
- Backend applications contain both internal status names and bank-facing `status_id` style mappings, which align with frontend status helpers in `lib/status-mapping.ts:15` and `lib/application-statuses.ts:14`.
- Chat moderation, attachments, and message state are backend-owned in `backend/apps/chat/models.py:14` and `backend/apps/chat/views.py:29`.
- Notification persistence and per-user settings are backend-owned in `backend/apps/notifications/models.py:12`.

### Tests

- Only backend tests were clearly verified: `backend/apps/applications/tests.py:13` covers serializer validation and public lead API behavior.
- No frontend test runner config was verified in the repo root or landing app.

## Phase 3 - Pre-Implementation Analysis

### 📋 Собранный контекст

- Verified monorepo split, framework versions, aliases, and service topology from `AGENTS.md`, package manifests, TS configs, backend settings, URL config, Docker compose, and nginx.
- Verified that Cabinet is the authenticated internal workspace, Landing is the public marketing/SEO app, and Django owns the API, websocket, and business logic layers.
- Verified shared abstractions that should be reused first: API clients, auth contexts, form stack, status mappings, document helpers, domain hooks, and backend serializers/models/views.
- Verified runtime blockers: no local services are up, so MCP-backed runtime inspection, live schema checks, database introspection, and browser verification are unavailable right now.

### ❓ Вопросы

- The issue asks to obtain the CEO persona from a default company source referenced by the operator, but that source is not visible from repo files or accessible issue comments.
- Paperclip task synchronization is inconsistent: `LIDA-1` is already marked `in_progress` with `checkoutRunId: null`, which blocks normal agent comment/update flow.
- MCP configuration files are present, but this workspace session does not expose those MCP servers directly, and local backend endpoints are down, so live MCP availability cannot be confirmed from runtime.
- Landing helper calls reference `/api/auth/*` paths, but only a `/health` route was directly verified in the landing Next app, so those auth-serving details remain unverified from current file review.

### 📐 План

1. Finish CEO setup artifacts locally and keep `agents/ceo/AGENTS.md` as the instructions source.
2. Package the verified repo analysis into a handoff document for future Paperclip comments or issue documents once the run-ownership problem is resolved.
3. When runtime services become available, verify backend HTTP, OpenAPI, `/mcp/`, database reachability, and websocket behavior before any implementation planning that depends on live state.
4. After the analysis is acknowledged, hire a Founding Engineer agent with repo-specific context only, then break delivery into scoped backend-first tasks.

### ⚠️ Риски

- Frontend changes that bypass shared API/auth/status/document helpers will drift from established patterns.
- Any feature work that assumes live backend services or DB state right now would be speculative.
- Application, company, document, and role-based flows are tightly coupled across frontend and backend, so contract drift is the highest integration risk.
- Paperclip issue mutation is currently unstable for this task, which risks losing audit trail updates unless the ownership state is repaired.
