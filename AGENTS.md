# AGENTS.md - Coding Agent Guidelines

## Project Overview
- Monorepo with 3 active apps:
  - Cabinet: Next.js 16 in repo root (`/app`, `/components`, `/hooks`, `/lib`)
  - Landing: Next.js 16 in `/lider-garant` (`/lider-garant/src/...`)
  - Backend: Django 5 + DRF in `/backend`
- Backend is the source of truth for validation, state transitions, and business rules.
- Frontends use TypeScript with `strict: true`.

## Critical Rules
- NEVER create or modify `opencode.json`, `.opencode/`, `.mcp.json`, or `mcp-config.json`.
- NEVER create commits unless explicitly requested.
- NEVER run destructive commands (`rm -rf`, `git reset --hard`, force push) without explicit approval.
- NEVER expose or log contents of `.env.mcp` — it contains live API tokens.
- NEVER run `DROP`, `TRUNCATE`, `DELETE` without `WHERE`, or `ALTER TABLE DROP COLUMN` via MCP postgres without explicit approval.
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

---

## MCP Tools — Autonomous Usage Protocol

> **Core principle: DON'T GUESS — VERIFY VIA MCP.**
>
> You have direct access to the project's database, cache, error tracking, documentation,
> browser, containers, and more. Use them proactively. If you're about to make an assumption
> about schema, data, errors, or library API — stop and query the appropriate MCP tool instead.

### Available MCP Servers

| Server         | Purpose                                   | Proactiveness   |
|----------------|-------------------------------------------|-----------------|
| `postgres`     | Direct access to `lider_garant` database  | **ALWAYS USE**  |
| `context7`     | Library/framework docs lookup             | **ALWAYS USE**  |
| `memory`       | Persistent knowledge graph                | **ALWAYS USE**  |
| `think`        | Sequential structured reasoning           | **ALWAYS USE**  |
| `sentry`       | Production error tracking                 | USE ON TRIGGER  |
| `github`       | GitHub issues, PRs, repo info             | USE ON TRIGGER  |
| `docker`       | Container management                      | USE ON TRIGGER  |
| `redis`        | Cache/session/queue inspection            | USE ON TRIGGER  |
| `puppeteer`    | Browser automation, visual testing        | USE ON TRIGGER  |
| `openapi`      | OpenAPI schema introspection              | USE ON TRIGGER  |
| `django-rest`  | Direct Django backend MCP endpoint        | USE ON TRIGGER  |
| `filestash`    | S3/MinIO document storage                 | ON REQUEST      |
| `brightdata`   | Web scraping via proxy                    | ON REQUEST      |

Additionally, these built-in tools are always available:
- `firecrawl` — web search, scrape, crawl, extract
- `google_search` — real-time web search
- `openmemory` — session memory persistence
- `sequential-thinking` — multi-step reasoning with revision
- `upstash-redis` — managed Redis operations (if Upstash configured)

---

### 1. PostgreSQL (`postgres_query`)

**TRIGGER — use automatically when:**
- You need to understand table structure, columns, types, or constraints
- You need to verify what data actually exists (don't guess row counts, enum values, etc.)
- User asks about data, reports, or statistics
- You're writing a Django migration and need to confirm current schema
- You're building a frontend form and need to know field constraints
- You're debugging a backend issue and need to inspect actual data state
- User mentions a model/table and you need its exact structure

**USAGE PATTERNS:**
```sql
-- Discover tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Understand a model's schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'TABLE_NAME' ORDER BY ordinal_position;

-- Check constraints and enums
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid = 'TABLE_NAME'::regclass;

-- Check foreign keys
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'TABLE_NAME' AND tc.constraint_type = 'FOREIGN KEY';

-- Inspect real data (always LIMIT)
SELECT * FROM table_name LIMIT 5;

-- Check indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'TABLE_NAME';
```

**NEVER:**
- Run `DROP`, `TRUNCATE`, `DELETE` without `WHERE`, `ALTER TABLE DROP COLUMN` without explicit user approval
- Run queries without `LIMIT` on large tables when exploring data
- Expose personally identifiable data in responses without necessity

---

### 2. Context7 (Library Documentation)

**TRIGGER — use automatically when:**
- You're about to use a library/framework API and aren't 100% sure of the exact syntax
- User asks "how do I do X with library Y"
- You're writing code with Next.js 16, React 19, Django 5, DRF, shadcn/ui, react-hook-form, zod, Tailwind, or any other project dependency
- You encounter a deprecation warning or API change
- You need to check if a feature exists in the version being used

**WORKFLOW:**
1. First call `context7_resolve-library-id` with the library name
2. Then call `context7_query-docs` with the resolved ID and your specific question

**EXAMPLES:**
```
# When writing Next.js App Router code:
resolve-library-id: query="Next.js app router server components", libraryName="next.js"
query-docs: libraryId="/vercel/next.js", query="how to use server actions with forms"

# When writing DRF serializer:
resolve-library-id: query="Django REST Framework serializers", libraryName="django-rest-framework"
query-docs: libraryId="...", query="nested writable serializer create and update"

# When using shadcn component:
resolve-library-id: query="shadcn/ui dialog component", libraryName="shadcn-ui"
query-docs: libraryId="...", query="AlertDialog with async confirm action"
```

**NEVER:**
- Guess at API syntax from training data when Context7 is available
- Call `query-docs` without first resolving the library ID
- Call either function more than 3 times per question

---

### 3. Memory / Knowledge Graph (`memory_*`)

**TRIGGER — use automatically when:**
- You discover important project facts during exploration (model relationships, architectural decisions, non-obvious patterns)
- You need to recall context from earlier in the session or from previous sessions
- You're making a decision that future sessions should know about
- User tells you something important about the project (business rules, conventions, domain knowledge)
- You find a bug pattern or non-obvious workaround

**USAGE PATTERNS:**
```
# Store discovered knowledge:
memory_create_entities: entities=[{
  name: "Application Model",
  entityType: "DjangoModel",
  observations: ["Has status field with choices: draft, pending, approved, rejected",
                  "FK to Partner via partner_id", "FK to User via user_id"]
}]

# Link related concepts:
memory_create_relations: relations=[{
  from: "Application Model", to: "Partner Model", relationType: "belongs_to"
}]

# Recall before making decisions:
memory_search_nodes: query="application status transitions"

# Add new facts to existing entity:
memory_add_observations: observations=[{
  entityName: "Application Model",
  contents: ["has custom manager ApplicationManager with active() queryset method"]
}]
```

**ALWAYS store:**
- Model schemas and their relationships after first discovery
- Business rule constraints (e.g., "only active partners can be assigned")
- Architectural decisions and patterns
- Non-obvious bug causes and their fixes
- Env-specific quirks (e.g., "cabinet uses port 3000, landing uses 3001")

---

### 4. Sequential Thinking (`sequential-thinking` / `think`)

**TRIGGER — use automatically when:**
- The task has 3+ interdependent steps
- You're debugging a non-trivial issue
- You need to make an architectural decision with tradeoffs
- You're planning a multi-file refactor
- The problem has ambiguity that needs structured exploration
- You catch yourself about to make a premature decision

**USAGE:** Use `sequential-thinking_sequentialthinking` for structured multi-step reasoning. Set `isRevision: true` when you realize a previous step was wrong. Adjust `totalThoughts` dynamically as the problem reveals its complexity.

---

### 5. Sentry (Error Tracking)

**TRIGGER — use automatically when:**
- User reports a bug or error in production
- User says something "doesn't work" or "shows an error" without details
- You need to understand the frequency or impact of an issue
- You're about to deploy and want to check error rate baseline
- User mentions error messages, 500 errors, or unexpected behavior in prod

**ACTION:** Query Sentry for recent errors matching the described issue. Extract stack traces, breadcrumbs, and affected user counts to inform debugging.

---

### 6. GitHub (`github`)

**TRIGGER — use automatically when:**
- User references a PR, issue, or commit by number
- You need to check recent changes that might explain a regression
- You need to review PR comments or check CI status
- User asks to create a PR or issue

**ACTION:** Use `gh` CLI via Bash tool for most GitHub operations. Use the MCP GitHub server for complex queries or when Bash is insufficient.

---

### 7. Docker (`docker`)

**TRIGGER — use automatically when:**
- User needs to check container status, logs, or health
- Something isn't working and you suspect a container is down
- You need to restart a service
- User asks about deployment or infrastructure state
- You need to run a command inside a container

**ACTION:** Use `docker_run_command` for in-container operations. Use Bash for `docker-compose` commands.

---

### 8. Redis (`redis`)

**TRIGGER — use automatically when:**
- You need to inspect cached data or session state
- You're debugging a caching issue
- User reports stale data that might be a cache problem
- You need to check Celery task queue state
- You need to flush specific cache keys after a data migration

**USAGE PATTERNS:**
```
# Inspect keys
SCAN 0 MATCH "prefix:*" COUNT 100
TYPE key_name
TTL key_name
GET key_name

# Check Celery queues (if using Celery)
LLEN celery
```

**NEVER:** Run `FLUSHALL` or `FLUSHDB` without explicit approval.

---

### 9. Puppeteer (Browser Automation)

**TRIGGER — use automatically when:**
- User asks to check what a page looks like
- You need to verify a UI change visually
- You need to test a form flow end-to-end
- User reports a visual bug
- You need to inspect the DOM state of a rendered page

**WORKFLOW:**
1. `puppeteer_navigate` to the URL
2. `puppeteer_screenshot` to capture current state
3. Optionally `puppeteer_evaluate` to inspect DOM/JS state
4. `puppeteer_click` / `puppeteer_fill` for interaction testing

**NOTE:** Local dev must be running (`npm run dev` or `docker-compose up`) for this to work.

---

### 10. Django REST MCP (`django-rest`)

**TRIGGER — use automatically when:**
- You need to interact with the backend API directly through MCP
- You need to test API endpoints without using curl/fetch
- The backend exposes MCP tools for introspection

**NOTE:** Requires the Django dev server running at `localhost:8000`. Available at `http://localhost:8000/mcp/`.

---

### 11. OpenAPI Introspection (`openapi`)

**TRIGGER — use automatically when:**
- You need to understand available API endpoints and their schemas
- You're building a frontend feature and need to know the exact request/response format
- User asks about available endpoints or API structure

---

### 12. Filestash / S3-MinIO (`filestash`)

**TRIGGER — use only when requested:**
- User asks about document uploads/downloads
- You need to inspect files in object storage
- You need to manage uploaded documents (list, delete, move)

---

### 13. Web Research (`firecrawl`, `google_search`)

**TRIGGER — use automatically when:**
- You encounter an error message you don't recognize
- You need up-to-date information (library releases, breaking changes, security advisories)
- Context7 doesn't have docs for a niche library or tool
- User asks about something external to the project (industry practices, comparisons, etc.)
- You need to find a specific solution to a non-obvious problem

**WORKFLOW:**
1. Try `context7` first for library/framework questions
2. Fall back to `google_search` or `firecrawl_firecrawl_search` for broader questions
3. Use `firecrawl_firecrawl_scrape` to extract content from a specific URL
4. Use `webfetch` for quick markdown content retrieval

---

### 14. OpenMemory (`openmemory`)

**TRIGGER — use automatically when:**
- You want to store session context that should persist across conversations
- You need to recall project preferences, patterns, or decisions from past sessions
- User explicitly says "remember this" or "keep in mind"

**USAGE PATTERNS:**
```
# Store project knowledge
openmemory_store: content="Cabinet app uses dynamic imports for dashboard charts to reduce initial bundle"

# Query past decisions
openmemory_query: query="status transition rules for applications"

# Browse recent memories
openmemory_list: limit=10
```

---

## MCP Cross-Tool Workflows

### Debugging a Production Bug
```
1. sentry          → Find error details, stack trace, frequency
2. postgres        → Check data state related to the error
3. redis           → Check if stale cache is involved
4. code search     → Find the code path from stack trace
5. context7        → Verify correct API usage of involved libraries
6. fix code        → Apply the fix
7. docker          → Run tests in container
8. memory          → Store the bug pattern for future reference
```

### Building a New Feature
```
1. postgres        → Understand existing schema
2. context7        → Check docs for libraries you'll use
3. think           → Plan the architecture
4. memory          → Check for related past decisions
5. implement       → Write the code
6. puppeteer       → Verify visually (if UI feature)
7. docker          → Run tests
8. memory          → Store architectural decisions
```

### Investigating Data Issues
```
1. postgres        → Query actual data state
2. redis           → Check cache consistency
3. backend code    → Trace data flow
4. sentry          → Check for related errors
5. fix             → Apply data migration or code fix
```

### Understanding Unfamiliar Code
```
1. memory          → Check if context was stored before
2. postgres        → Understand the data model
3. context7        → Look up framework patterns used
4. code search     → Trace call chains
5. memory          → Store what you learned
```

---

## MCP Safety Boundaries

### Read-Only by Default
- Treat all MCP data sources as **read-only** unless the user explicitly requests a write operation.
- `postgres`: SELECT only. No INSERT/UPDATE/DELETE without approval.
- `redis`: Read commands only. No SET/DEL/FLUSH without approval.
- `docker`: Status/logs only. No stop/rm/restart without approval.
- `github`: Read operations only. No create/merge/close without approval.

### Escalation Rules
If an MCP tool returns an error or unexpected result:
1. Do NOT retry the same query more than twice.
2. Report the error to the user with the exact error message.
3. Suggest an alternative approach.
4. If a service appears down, note it and proceed with file-based analysis.

### Token & Credential Security
- NEVER read, log, or display contents of `.env.mcp`.
- NEVER include API tokens, database passwords, or secrets in code, logs, or responses.
- If a tool requires credentials, reference the config file — never the actual values.

---

## Cursor / Copilot Rules
- `.cursor/rules/`: not found
- `.cursorrules`: not found
- `.github/copilot-instructions.md`: not found
