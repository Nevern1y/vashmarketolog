# Lider Garant Roadmap

## Basis

This roadmap is grounded only in verified repository facts from `agents/ceo/REPO_ANALYSIS.md`.

## Immediate Priorities

1. Restore runtime observability
   - Bring up local services defined in `docker-compose.yml`.
   - Verify backend HTTP, `/mcp/`, database, Redis, and MinIO reachability.
   - Confirm whether configured MCP integrations are actually usable from the working environment.

2. Lock contract visibility
   - Inventory backend serializers, view payloads, and status/document enums for the highest-traffic flows.
   - Cross-check Cabinet and Landing frontend types against backend sources of truth.
   - Identify any duplicated or drifting DTO logic.

3. Stabilize the highest-value product flows
   - Authentication and role routing.
   - Company profile capture and CRM flows.
   - Application lifecycle, assignment, and status transitions.
   - Document upload/request fulfillment.
   - Public lead capture from Landing.

4. Improve operational confidence
   - Expand backend test coverage beyond the current `backend/apps/applications/tests.py` baseline.
   - Add focused verification steps for contract-sensitive frontend flows once runtime is available.
   - Resolve Paperclip issue ownership/run-state drift so agent reporting is reliable.

## Suggested Task Breakdown

### Track 1 - Environment And Tooling
- Verify Docker services and local ports.
- Confirm runtime MCP availability vs static-only fallback.
- Document blocked services and operator dependencies.

### Track 2 - Backend Contract Audit
- Map auth, companies, applications, documents, notifications, chat, and SEO endpoints.
- Extract serializer-level validation and role restrictions.
- Document status and document ID sources used by frontends.

### Track 3 - Cabinet Audit
- Review dashboard entry flows, auth bootstrapping, and role-based routing.
- Trace hooks that drive applications, documents, chat, and notifications.
- Flag places where frontend assumptions may outrun backend truth.

### Track 4 - Landing Audit
- Review SEO page fetching, lead capture flows, and auth helpers.
- Confirm which routes are true Next handlers vs backend-proxied expectations.
- Identify shared types or helpers that should be aligned with backend contracts.

### Track 5 - Delivery Pipeline
- Define backend-first implementation order for future features.
- Add targeted backend tests per changed contract.
- Run app-specific lint/build verification only for touched surfaces.
