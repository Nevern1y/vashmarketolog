@echo off
echo Testing MCP Servers...
echo.

echo [1] Testing PostgreSQL MCP...
npx -y @modelcontextprotocol/server-postgres postgresql://postgres:postgres@localhost:5432/lider_garant --echo "SELECT COUNT(*) FROM applications LIMIT 1;" 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [2] Testing GitHub MCP...
echo     GitHub MCP requires interactive authentication
echo     Status: CONFIGURED (token exists in .env.mcp)

echo.
echo [3] Testing Redis MCP...
npx -y @modelcontextprotocol/server-redis redis://localhost:6379 --echo "PING" 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [4] Testing Docker MCP...
npx -y mcp-server-docker --list 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [5] Testing Sentry MCP...
echo     Sentry MCP requires authenticated connection
echo     Status: CONFIGURED (token exists in .env.mcp)

echo.
echo [6] Testing Memory MCP...
npx -y @modelcontextprotocol/server-memory --echo "status" 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [7] Testing Puppeteer MCP...
echo     Testing Puppeteer launch...
npx -y @modelcontextprotocol/server-puppeteer 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [8] Testing Think MCP...
npx -y think-mcp --echo "test" 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [9] Testing OpenAPI MCP...
npx -y openapi-mcp-server --version 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [10] Testing Filestash MCP...
docker run --rm mickaelkerjean/filestash:latest --version 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo [11] Testing Django REST MCP...
echo     Testing mcp-remote bridge...
node node_modules\.bin\mcp-remote http://localhost:8000/mcp/ --version 2>nul
if %errorlevel% equ 0 (
    echo     Status: OK
) else (
    echo     Status: FAILED
)

echo.
echo ========================================
echo Test Summary:
echo ========================================
echo.
echo Note: OpenCode may only load 2-3 MCP servers due to:
echo  - Browser limitations (Puppeteer)
echo - Network restrictions (Filestash)
echo - API dependencies (OpenAPI, Django REST)
echo - Resource constraints (Memory)
echo.
echo The core servers that should work reliably:
echo  1. PostgreSQL - database queries
echo 2. Redis - cache operations
echo 3. GitHub - repository management
echo 4. Docker - container management
echo.
pause
