# MCP Configuration Guide

This directory contains the Model Context Protocol (MCP) server configuration for the OpenCode AI assistant.

## Files

- `.env.mcp` - Environment variables for MCP servers (secrets)
- `mcp.json` - MCP server configuration

## Installation Status

✅ **All MCP servers installed and configured on 2026-01-16**

What was set up:
- Created `mcp.json` with 11 MCP server configurations
- Created `.env.mcp` with GitHub and Sentry tokens
- Added `.env.mcp` to `.gitignore` for security
- Installed `django-rest-framework-mcp` in backend Django project
- Added `djangorestframework_mcp` to Django `INSTALLED_APPS`
- Added MCP endpoint to Django `urls.py` at `/mcp/`
- Updated `backend/requirements.txt` with `django-rest-framework-mcp==0.1.0a4`
- Rebuilt and restarted Docker backend container
- Verified MCP endpoint is accessible at `http://localhost:8000/mcp/`
- Installed `mcp-remote` globally for HTTP transport

All servers are ready to use! Just restart OpenCode.

## Quick Start

### 1. Verify Docker Services

Ensure all services are running:

```bash
docker-compose ps
```

If not running, start them:

```bash
docker-compose up -d
```

### 2. Start OpenCode with MCP

OpenCode will automatically use the `mcp.json` configuration file.

**Note:** All MCP servers are already installed and configured. Just restart OpenCode to load the configuration!

## Configured MCP Servers

| Server | Purpose | Status |
|--------|---------|--------|
| `postgres` | Direct PostgreSQL access | ✅ Ready |
| `github` | GitHub integration (PRs, issues) | ✅ Ready |
| `redis` | Redis cache management | ✅ Ready |
| `docker` | Docker container management | ✅ Ready |
| `sentry` | Error monitoring | ✅ Ready |
| `openapi` | REST API testing via OpenAPI spec | ✅ Ready |
| `memory` | Persistent knowledge graph | ✅ Ready |
| `puppeteer` | Browser automation | ✅ Ready |
| `think` | Enhanced reasoning | ✅ Ready |
| `filestash` | MinIO S3 file access | ✅ Ready |
| `django-rest` | Django REST Framework integration | ✅ Ready (via mcp-remote) |

## Usage Examples

### Query PostgreSQL directly

```
Query the applications table:
SELECT id, status, created_at FROM applications ORDER BY created_at DESC LIMIT 10;
```

### Check Redis cache

```
List all Redis keys: KEYS *
Get specific key: GET session:123
```

### GitHub operations

```
List open PRs: List pull requests in current repo
Create issue: Create a new issue with title "Bug fix needed"
```

### Docker management

```
List containers: List all running containers
View logs: Show logs for backend container
```

### Sentry monitoring

```
View recent errors: Show errors from last 24 hours
Check performance: Show performance metrics
```

### Memory persistence

```
Remember architecture: Remember that the frontend uses Next.js with shadcn/ui
Recall: What database schema do we use?
```

### Django REST API interaction

```
List all applications: applications_list
Get application by ID: applications_retrieve {"pk": 1}
Create new application: applications_create {"body": {...}}
```

### Enhanced reasoning with Think MCP

```
Analyze this requirement: We need to add a new field to the application form
Breakdown this task: Implement bank guarantee status tracking workflow
```

## Troubleshooting

### PostgreSQL connection fails

Ensure Docker services are running:
```bash
docker-compose ps
docker-compose up -d db redis minio
```

### Redis not accessible

Check Redis container:
```bash
docker logs lider_garant_redis
```

### Django REST MCP not working

The Django REST MCP endpoint should be available at `http://localhost:8000/mcp/`. Check:

```bash
curl -I http://localhost:8000/mcp/
```

Expected response: `HTTP/1.1 405 Method Not Allowed` (endpoint exists but requires POST)

If backend container has issues:

```bash
docker-compose restart backend
docker logs lider_garant_backend --tail 50
```

To rebuild backend (if dependencies changed):

```bash
docker-compose build backend
docker-compose up -d backend
```

### GitHub token expired

Generate a new token at https://github.com/settings/tokens and update `.env.mcp`

## Security Notes

- `.env.mcp` contains sensitive tokens
- Add `.env.mcp` to `.gitignore`
- Rotate GitHub and Sentry tokens regularly

## Project-Specific Connection Details

- **PostgreSQL:** `postgres:postgres@localhost:5432/lider_garant`
- **Redis:** `localhost:6379`
- **Django API:** `http://localhost:8000/api`
- **Django MCP Endpoint:** `http://localhost:8000/mcp/`
- **MinIO:** `http://localhost:9000` (admin: `http://localhost:9001`)

## MCP Server Documentation

- [PostgreSQL MCP](https://github.com/modelcontextprotocol/servers-archived/tree/main/src/postgres)
- [GitHub MCP](https://github.com/github/github-mcp-server)
- [Redis MCP](https://github.com/redis/mcp-redis)
- [Docker MCP](https://github.com/ckreiling/mcp-server-docker)
- [Sentry MCP](https://github.com/getsentry/sentry-mcp)
- [Memory MCP](https://github.com/modelcontextprotocol/servers/tree/main/src/memory)
- [Think MCP](https://github.com/Rai220/think-mcp)
- [mcp-remote](https://github.com/geelen/mcp-remote) - HTTP transport bridge for MCP
- [Django REST Framework MCP](https://github.com/zacharypodbela/djangorestframework-mcp)
