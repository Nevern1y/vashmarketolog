# MCP Quick Reference

## Server Names and Commands

| Server Name | Command Pattern | Example Usage |
|------------|-----------------|---------------|
| `postgres` | `SELECT`, `INSERT`, `UPDATE` | `SELECT * FROM applications LIMIT 5;` |
| `github` | `List`, `Create`, `Get` | `List open pull requests`, `Create issue` |
| `redis` | `KEYS`, `GET`, `SET`, `DEL` | `KEYS session:*`, `GET cache:api` |
| `docker` | `List`, `Logs`, `Restart` | `List running containers`, `Show backend logs` |
| `sentry` | `Show`, `Query` | `Show errors from last hour`, `Query performance` |
| `openapi` | `Test`, `Call` | `Test GET /api/applications/` |
| `memory` | `Remember`, `Recall`, `Save` | `Remember the API structure`, `Recall database schema` |
| `puppeteer` | `Navigate`, `Click`, `Screenshot` | `Take screenshot of http://localhost:3000` |
| `think` | `Analyze`, `Reason`, `Breakdown` | `Analyze this complex requirement` |
| `filestash` | `List`, `Upload`, `Download` | `List files in /documents` |
| `django-rest` | `List`, `Get`, `Create` | `List applications`, `Get application 1` |

## Common Workflows

### Debugging a Database Issue
1. Use `postgres` to query the data
2. Check `redis` for cached values
3. Use `memory` to save findings for later

### Testing an API Endpoint
1. Use `openapi` to test the endpoint
2. Check `postgres` for data changes
3. Use `sentry` to check for errors

### Monitoring Production
1. Use `sentry` to view recent errors
2. Check `docker` container logs
3. Use `github` to file issues if needed

### Learning Project Architecture
1. Use `postgres` to inspect database schema
2. Use `github` to review recent commits
3. Use `memory` to save key architectural decisions

## Server Dependencies

- Requires Docker services running: `db`, `redis`, `minio`
- Requires Python venv for `django-rest`
- Requires GitHub token in `.env.mcp`
- Requires Sentry auth token in `.env.mcp`

## Quick Commands

```bash
# Start all Docker services
docker-compose up -d

# Restart OpenCode to reload MCP config
# (Close and reopen OpenCode)

# Test PostgreSQL connection
docker exec -it lider_garant_db psql -U postgres -d lider_garant

# Test Redis connection
docker exec -it lider_garant_redis redis-cli ping

# View Docker logs
docker-compose logs -f backend
```
