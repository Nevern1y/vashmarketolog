# AGENTS.md - Coding Agent Guidelines

## Project Overview
- Monorepo with 3 active apps:
  - Cabinet: Next.js 16 in repo root (`/app`, `/components`, `/hooks`, `/lib`)
  - Landing: Next.js 16 in `/lider-garant` (`/lider-garant/src/...`)
  - Backend: Django 5 + DRF in `/backend`
- Backend is the source of truth for validation, state transitions, and business rules.
- Frontends use TypeScript with `strict: true`.

## Critical Rules
- NEVER create or modify `opencode.json` or `.opencode/`.
- NEVER create commits unless explicitly requested.
- NEVER run destructive commands (`rm -rf`, `git reset --hard`, force push) without explicit approval.
- Keep changes scoped to the request; avoid unrelated refactors.
- Prefer existing config files (`.mcp.json`, `.env.mcp`) when needed.

## Repository Layout
```txt
/app                    # Cabinet app routes/layouts
/components             # Cabinet UI and dashboard components
/hooks                  # Cabinet hooks
/lib                    # Cabinet API/auth/mappings/utils
/backend                # Django backend
/lider-garant           # Landing app
/nginx                  # Nginx production config
```

## Build / Lint / Run Commands

### Cabinet (repo root)
```bash
npm run dev
npm run build
npm run lint
npm run start
```

### Landing (`/lider-garant`)
```bash
npm run dev
npm run build
npm run lint
npm run start
```

### Backend (`/backend`)
```bash
python manage.py runserver 0.0.0.0:8000
python manage.py migrate
python manage.py makemigrations
```

### Docker (repo root)
```bash
docker-compose up -d
docker-compose -f docker-compose.prod.yml up -d --build
```

## Tests (Single-Test Focus)

### Current state
- Django tests are configured.
- No Jest/Vitest/Playwright config is present in this repo.

### Backend test commands (`/backend`)
```bash
# all tests
python manage.py test

# single module
python manage.py test apps.applications.tests

# single class
python manage.py test apps.applications.tests.ApplicationAssignSerializerTest

# single method
python manage.py test apps.applications.tests.ApplicationAssignSerializerTest.test_assign_inactive_partner
```

### Docker equivalents (repo root)
```bash
docker-compose exec backend python manage.py test
docker-compose exec backend python manage.py test apps.applications.tests.ApplicationAssignSerializerTest.test_assign_inactive_partner
```

## TypeScript / React Style

### Imports
- In client components, keep `"use client"` as the first line.
- Preferred order: React/Next -> third-party -> alias imports (`@/...`) -> relative imports -> type imports.
- Prefer `import type` for type-only imports.
- Avoid style-only import churn in untouched files.

### Formatting
- Match local file style (quotes, semicolons, spacing, indentation).
- Repo style is mixed; do not run global formatting passes.
- Keep diffs focused on behavior, not cosmetics.

### Types
- Prefer explicit interfaces/types for API payloads and responses.
- Avoid `any`; prefer specific types, `unknown`, or `Record<string, unknown>`.
- Keep API calls typed (`api.get<T>`, `api.post<T>`, etc.).
- Alias mapping:
  - Cabinet: `@/* -> ./*`
  - Landing: `@/* -> ./src/*`

### Naming
- Components: `PascalCase`.
- Hooks: `useX`.
- Handlers: `handleAction`.
- Constants: `UPPER_SNAKE_CASE`.
- Props interfaces: `ComponentProps` pattern.

## Error Handling and UX
- Use `try/catch/finally` for async flows; clear loading in `finally`.
- Frontend API error pattern:
  - `const apiError = err as ApiError`
  - show feedback with `toast` from `sonner`
- Use `AlertDialog` for destructive confirmations.
- Avoid `window.alert` / `window.confirm` in app flows.
- In data hooks, handled mutation failures should usually return `null` or `false`.

## API / Data Rules
- Use shared API client (`@/lib/api` and landing equivalent), avoid ad-hoc `fetch` in feature code.
- Use `api.uploadWithProgress` for upload flows that need progress.
- Auth providers:
  - Cabinet: `@/lib/auth-context`
  - Landing: `/lider-garant/src/lib/auth-context`
- Reuse shared status mapping helpers:
  - `lib/status-mapping.ts`
  - `lib/application-statuses.ts`

## Forms and Styling
- Preferred forms stack: `react-hook-form` + `zod` + `zodResolver`.
- Keep validation schema close to form implementation.
- Use `z.coerce.number()` for numeric inputs when needed.
- Use `cn()` from `@/lib/utils` for class merging.
- Reuse existing CSS variables and shared status colors.

## Django / DRF Style
- 4-space indentation.
- `snake_case` for functions/variables, `PascalCase` for classes.
- Import order: stdlib -> third-party -> local modules.
- Use serializers for validation and normalization.
- Prefer existing class-based patterns (`APIView`, generics, viewsets).
- Return `Response(..., status=status.HTTP_...)` with explicit status codes.
- Use `get_object_or_404` where appropriate.
- Use `timezone.now()` for timestamps.
- Keep and extend `@extend_schema` annotations.

## Verification Before Handoff
- Run relevant build/lint commands for touched app(s).
- For backend behavior changes, run at least one targeted Django test when feasible.
- If anything is not verified, state exactly what was skipped and why.

## Cursor / Copilot Rules
- `.cursor/rules/`: not found
- `.cursorrules`: not found
- `.github/copilot-instructions.md`: not found
