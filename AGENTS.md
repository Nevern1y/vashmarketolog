# AGENTS.md - Coding Agent Guidelines

## Project Overview
- Next.js 16 Cabinet app in repo root (`/app`, `/components`, `/hooks`, `/lib`).
- Next.js 16 Landing app in `/lider-garant`.
- Django REST Framework backend in `/backend`.
- Backend is the source of truth; frontends adapt visuals and UX.

## Critical Instructions (Must Follow)
- NEVER create or modify `opencode.json` or `.opencode/`.
- NEVER create git commits unless explicitly requested.
- NEVER run destructive commands (rm -rf, git reset --hard) without explicit consent.
- Prefer `mcp.json`/`.env.mcp` for MCP config if needed; do not create new configs.

## Repo Layout
```
/app                    # Cabinet (Next.js App Router)
/components             # UI + dashboard components
/hooks                  # Cabinet hooks
/lib                    # API client, auth, status mapping, utils
/backend                # Django backend
/lider-garant           # Landing Next.js app
/nginx                  # Nginx configs + SSL (prod)
```

## Build / Lint / Run
```bash
# Cabinet (repo root)
npm run dev
npm run build
npm run lint
npm run start

# Landing (from /lider-garant)
npm run dev
npm run build
npm run lint
npm run start

# Backend (from /backend)
python manage.py runserver 0.0.0.0:8000
python manage.py migrate

# Docker (dev)
docker-compose up -d

# Docker (prod)
docker-compose -f docker-compose.prod.yml up -d --build
```

## Tests (Single-Test Focus)
- No JS test framework is configured by default.
- If JS tests are added later:
  - Jest: `npx jest path/to/test.ts`
  - Vitest: `npx vitest run path/to/test.ts`
- Django built-in runner:
  - All tests: `python manage.py test`
  - Single module: `python manage.py test apps.users.tests.test_views`
  - Single case/method: `python manage.py test apps.users.tests.test_views.TestClass.test_method`

## TypeScript / React Code Style
- Strict mode is enabled in `tsconfig.json`.
- Path alias: `@/*` → repo root (Cabinet), `@/*` → `/lider-garant/src` (Landing).
- Match the local file style (quotes/semicolons/indentation); avoid global reformatting.
- Add `"use client"` as the first line for client components.
- Prefer `import type` for type-only imports.

### Import Order
```ts
"use client"

import { useState, useCallback } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/use-applications'
import { cn } from '@/lib/utils'
import api, { type ApiError } from '@/lib/api'
import type { ViewType } from '@/lib/types'
```

### Components & Naming
- Components: PascalCase. Files: kebab-case.
- Props: `interface PropsName { ... }`.
- Handlers: `handle<Action>` naming.
- Hooks: `useX` prefix.

### Hooks Return Shape
```ts
return { data, isLoading, error, refetch }
```

## Error Handling & UX
- Use try/catch/finally; always clear loading in `finally`.
- Cast API errors: `const apiError = err as ApiError`.
- Use `toast` from `sonner` for user feedback.
- Use shadcn/ui `AlertDialog` for confirmations; avoid `window.confirm/alert`.
- Avoid legacy `hooks/use-toast.ts` and `components/ui/toaster.tsx`.
- On mutation errors, return `null` instead of throwing.

## API & Data Rules
- Use `api` from `@/lib/api` for all requests (no raw fetch).
- Use `api.uploadWithProgress` for uploads that need progress.
- Auth: `useAuth` from `@/lib/auth-context`.
- Status mapping: always use `getStatusConfig` from `lib/status-mapping.ts`.
- Bank numeric statuses: use `lib/application-statuses.ts`.
- NEVER use switch-case for status mapping.

## Key Files
- `lib/api.ts` - API client with auth/refresh and upload helpers.
- `lib/status-mapping.ts` - Status → visual config (single source of truth).
- `lib/application-statuses.ts` - Bank status IDs and labels.
- `lib/auth-context.tsx` - Auth state and helpers.
- `hooks/use-applications.ts` - Application queries/mutations.
- `components/ui/alert-dialog.tsx` - Confirmation dialog component.

## Forms (react-hook-form + zod)
```ts
const schema = z.object({
  inn: z.string().min(10).max(12),
  employee_count: z.coerce.number().optional(),
})
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
```

## Styling
- Use `cn()` from `@/lib/utils` for class merging.
- Base colors used in UI: `#0a1628` background, `#3CE8D1` primary.
- Prefer Tailwind opacity utilities like `bg-[#3CE8D1]/10`.

## Django / Python Style
- 4-space indentation; snake_case for functions/variables.
- Imports: stdlib → third-party → local apps.
- DRF patterns: serializers for validation, class-based views (APIView/generics).
- Use `Response` with `status.*` codes; prefer `get_object_or_404`.
- Use `timezone` for timestamps.
- Add/keep `@extend_schema` annotations for API docs.

## Environment
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
INTERNAL_API_URL=http://backend:8000/api
```

## Cursor / Copilot Rules
- No `.cursor/rules`, `.cursorrules`, or `.github/copilot-instructions.md` found.
