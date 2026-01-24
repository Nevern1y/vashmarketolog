@echo off
echo Installing MCP Server Dependencies...
echo.

echo [1/3] Installing django-rest-framework-mcp...
cd backend
pip install django-rest-framework-mcp==0.1.0a4
cd ..
if %errorlevel% neq 0 (
    echo Failed to install djangorestframework-mcp
    pause
    exit /b 1
)
echo Success!
echo.

echo [2/3] Verifying Docker services are running...
docker-compose ps >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is not running. Please start Docker first.
    pause
    exit /b 1
)
echo Success!
echo.

echo [3/3] Ensuring Docker services are up...
docker-compose up -d db redis minio
if %errorlevel% neq 0 (
    echo Failed to start Docker services.
    pause
    exit /b 1
)
echo Success!
echo.

echo ==========================================
echo MCP Servers Setup Complete!
echo ==========================================
echo.
echo Configured MCP Servers:
echo - postgres: PostgreSQL database access
echo - github: GitHub integration
echo - redis: Redis cache management
echo - docker: Docker container management
echo - sentry: Error monitoring
echo - openapi: REST API testing
echo - memory: Persistent knowledge graph
echo - puppeteer: Browser automation
echo - think: Enhanced reasoning
echo - filestash: MinIO S3 file access
echo - django-rest: Django REST Framework integration
echo.
echo Next steps:
echo 1. Restart OpenCode to load MCP configuration
echo 2. Check MCP_README.md for usage examples
echo.
pause
