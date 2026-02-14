#!/bin/bash

# =============================================================================
# DEPLOY SCRIPT FOR LIDER GARANT
# Server: configurable (default: 194.156.117.197)
# Domains: lider-garant.ru, www.lider-garant.ru, lk.lider-garant.ru
# =============================================================================
#
# Features:
#   - All code from YOUR repository (no external submodules)
#   - Real SSL certificates via Let's Encrypt
#   - Database preserved between deploys (Docker volume)
#   - Optional DB reset with RESET_DB=true
#   - Safe container management (no data loss)
#
# =============================================================================

set -euo pipefail  # Exit on error, undefined vars, and pipeline failures

REPO_URL="https://github.com/Nevern1y/vashmarketolog"
PROJECT_DIR="/opt/vashmarketolog"
DOMAINS="lider-garant.ru www.lider-garant.ru lk.lider-garant.ru"
EMAIL="admin@lider-garant.ru"  # For Let's Encrypt notifications
GIT_BRANCH="${GIT_BRANCH:-main}"
RESET_DB="${RESET_DB:-false}"
MAX_PULL_RETRIES="${MAX_PULL_RETRIES:-3}"
PULL_RETRY_DELAY="${PULL_RETRY_DELAY:-5}"
MIN_DOCKER_FREE_GB="${MIN_DOCKER_FREE_GB:-5}"
DOCKER_DNS="${DOCKER_DNS:-}"
DISABLE_BUILDKIT="${DISABLE_BUILDKIT:-false}"
LANDING_DOMAIN="${LANDING_DOMAIN:-lider-garant.ru}"
SERVER_PUBLIC_IP="${SERVER_PUBLIC_IP:-194.156.117.197}"
SEO_TEMPLATE_PROBE="${SEO_TEMPLATE_PROBE:-guarantees}"
SEO_SLUG_PROBE="${SEO_SLUG_PROBE:-bankovskie-garantii-na-ispolnenie-kontrakta}"
ENABLE_SEO_SMOKE_CHECK="${ENABLE_SEO_SMOKE_CHECK:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

trap 'echo -e "${RED}✗ Ошибка на строке $LINENO. Деплой остановлен.${NC}"' ERR

if [ "$(id -u)" -ne 0 ]; then
    echo "Запустите скрипт от root: sudo bash deploy-server.sh"
    exit 1
fi

warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_docker_space() {
    local docker_root
    docker_root=$(docker info -f '{{.DockerRootDir}}' 2>/dev/null || echo "/var/lib/docker")
    if [ -d "$docker_root" ]; then
        local avail_kb
        avail_kb=$(df -Pk "$docker_root" | awk 'NR==2 {print $4}')
        if [ -n "$avail_kb" ]; then
            local avail_gb=$((avail_kb / 1024 / 1024))
            if [ "$avail_gb" -lt "$MIN_DOCKER_FREE_GB" ]; then
                warn "Низкий запас места в $docker_root: ~${avail_gb}GB. Рекомендуется минимум ${MIN_DOCKER_FREE_GB}GB."
            fi
        fi
    fi
}

configure_docker_dns() {
    if [ -z "$DOCKER_DNS" ]; then
        return
    fi

    if [ -f /etc/docker/daemon.json ]; then
        if grep -q '"dns"' /etc/docker/daemon.json; then
            echo "Docker DNS уже настроен, пропускаем."
            return
        fi
        warn "Найден /etc/docker/daemon.json без dns. Не изменяю автоматически. Настройте вручную при необходимости."
        return
    fi

    IFS=',' read -r -a dns_list <<< "$DOCKER_DNS"
    if [ ${#dns_list[@]} -eq 0 ]; then
        return
    fi

    local dns_json
    dns_json=$(printf '"%s",' "${dns_list[@]}")
    dns_json="[${dns_json%,}]"

    echo "{\"dns\": ${dns_json}}" > /etc/docker/daemon.json
    systemctl restart docker 2>/dev/null || true
    echo "Docker DNS задан: ${DOCKER_DNS}"
}

retry_pull() {
    local image="$1"
    local attempt=1
    while [ "$attempt" -le "$MAX_PULL_RETRIES" ]; do
        echo "Pulling $image (attempt $attempt/$MAX_PULL_RETRIES)..."
        if docker pull "$image"; then
            return 0
        fi
        if [ "$attempt" -ge "$MAX_PULL_RETRIES" ]; then
            return 1
        fi
        echo -e "${YELLOW}Повтор через ${PULL_RETRY_DELAY}s...${NC}"
        sleep "$PULL_RETRY_DELAY"
        attempt=$((attempt + 1))
    done
}

echo -e "${GREEN}=== ДЕПЛОЙ LIDER GARANT на сервер ${SERVER_PUBLIC_IP} ===${NC}"
echo ""

if [ "$RESET_DB" = "true" ]; then
    echo -e "${RED}!!! RESET_DB=true: база данных будет удалена !!!${NC}"
    echo ""
fi

# =============================================================================
# Шаг 1: Установка зависимостей
# =============================================================================
echo -e "${YELLOW}Шаг 1: Проверка и установка зависимостей...${NC}"
apt update -qq

# Install git and curl only (avoid Docker package conflicts)
apt install -y git curl

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "Docker уже установлен: $(docker --version)"
else
    echo "Установка Docker из официального репозитория..."
    curl -fsSL https://get.docker.com | sh
fi

# Check if docker compose plugin is available
if docker compose version &> /dev/null 2>&1; then
    echo "Docker Compose уже установлен: $(docker compose version --short 2>/dev/null || echo 'OK')"
else
    echo "Установка Docker Compose plugin..."
    # Install compose plugin manually (avoid apt containerd conflict)
    DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
    echo "Docker Compose установлен: $(docker compose version --short 2>/dev/null || echo 'OK')"
fi

# Ensure Docker is running
systemctl enable docker 2>/dev/null || true
systemctl start docker 2>/dev/null || true

echo -e "${GREEN}✓ Зависимости установлены${NC}"
echo ""

# =============================================================================
# Шаг 2: Клонирование/обновление репозитория
# =============================================================================
echo -e "${YELLOW}Шаг 2: Синхронизация репозитория...${NC}"
if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Обновление существующего репозитория..."

    # Preserve runtime env files before hard reset
    PRESERVE_DIR="/tmp/lider_env_preserve_$$"
    mkdir -p "$PRESERVE_DIR"
    [ -f "$PROJECT_DIR/.env" ] && cp "$PROJECT_DIR/.env" "$PRESERVE_DIR/.env"
    [ -f "$PROJECT_DIR/.env.prod" ] && cp "$PROJECT_DIR/.env.prod" "$PRESERVE_DIR/.env.prod"

    cd "$PROJECT_DIR"
    git fetch origin "$GIT_BRANCH"
    git reset --hard "origin/$GIT_BRANCH"

    # Keep local runtime env files untouched
    git clean -fd -e .env -e .env.prod

    # Restore preserved env files if they existed
    [ -f "$PRESERVE_DIR/.env" ] && cp "$PRESERVE_DIR/.env" "$PROJECT_DIR/.env"
    [ -f "$PRESERVE_DIR/.env.prod" ] && cp "$PRESERVE_DIR/.env.prod" "$PROJECT_DIR/.env.prod"
    rm -rf "$PRESERVE_DIR"
else
    echo "Первоначальное клонирование репозитория..."
    rm -rf "$PROJECT_DIR"
    git clone --branch "$GIT_BRANCH" --single-branch "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

echo -e "${GREEN}✓ Репозиторий синхронизирован${NC}"
echo "Ветка: $GIT_BRANCH"
echo "Коммит: $(git rev-parse --short HEAD)"
echo ""

# =============================================================================
# Шаг 3: Создание/обновление .env и .env.prod
# =============================================================================
echo -e "${YELLOW}Шаг 3: Настройка переменных окружения...${NC}"

# Ensure runtime env files exist
ENV_FILE="$PROJECT_DIR/.env"
ENV_PROD_FILE="$PROJECT_DIR/.env.prod"

# Check if .env exists and has core credentials for compose interpolation
if [ -f "$ENV_FILE" ] && grep -q "^SECRET_KEY=" "$ENV_FILE"; then
    echo "Используем существующий .env файл"
else
    echo "Создание .env файла..."
    # Generate secure secret key
    SECRET_KEY=$(openssl rand -base64 50 | tr -dc 'a-zA-Z0-9' | head -c 64)
    DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

    cat > "$ENV_FILE" << ENVEOF
# Generated by deploy-server.sh on $(date)
SECRET_KEY=$SECRET_KEY
DB_NAME=lider_garant
DB_USER=postgres
DB_PASSWORD=$DB_PASSWORD
DB_HOST=db
DB_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
ALLOWED_HOSTS=.lider-garant.ru,lk.lider-garant.ru,${SERVER_PUBLIC_IP},localhost
CORS_ALLOWED_ORIGINS=https://lk.lider-garant.ru,https://lider-garant.ru
BANK_API_URL=https://stagebg.realistbank.ru/agent_api1_1
BANK_API_LOGIN=
BANK_API_PASSWORD=
SECURE_SSL_REDIRECT=False
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
ENVEOF

    echo -e "${YELLOW}ВНИМАНИЕ: Обновите BANK_API_LOGIN и BANK_API_PASSWORD в $ENV_FILE${NC}"
fi

# Ensure .env.prod exists (used by docker-compose.prod env_file)
if [ ! -f "$ENV_PROD_FILE" ]; then
    if [ -f "$PROJECT_DIR/.env.prod.example" ]; then
        cp "$PROJECT_DIR/.env.prod.example" "$ENV_PROD_FILE"
    else
        touch "$ENV_PROD_FILE"
    fi
fi

set_env() {
    local key="$1"
    local value="$2"
    local file="$3"
    local escaped_value
    escaped_value=$(printf '%s' "$value" | sed -e 's/[\\&|]/\\&/g')

    if grep -q "^${key}=" "$file"; then
        sed -i "s|^${key}=.*|${key}=${escaped_value}|" "$file"
    else
        echo "${key}=${value}" >> "$file"
    fi
}

get_env_value() {
    local key="$1"
    local file="$2"
    grep -E "^${key}=" "$file" 2>/dev/null | tail -n1 | cut -d= -f2-
}

SMTP_USER="${SMTP_USER:-}"
if [ -z "$SMTP_USER" ]; then
    SMTP_USER="$(get_env_value "EMAIL_HOST_USER" "$ENV_PROD_FILE")"
fi
if [ -z "$SMTP_USER" ]; then
    SMTP_USER="noreply@lider-garant.ru"
fi
SMTP_PASSWORD="${SMTP_PASSWORD:-}"

# Fallback to previously saved value (first from .env.prod, then from .env)
if [ -z "$SMTP_PASSWORD" ]; then
    SMTP_PASSWORD="$(get_env_value "EMAIL_HOST_PASSWORD" "$ENV_PROD_FILE")"
fi
if [ -z "$SMTP_PASSWORD" ]; then
    SMTP_PASSWORD="$(get_env_value "EMAIL_HOST_PASSWORD" "$ENV_FILE")"
fi

# Enforce SMTP password for production reliability
if [ -z "$SMTP_PASSWORD" ]; then
    echo -e "${RED}✗ EMAIL_HOST_PASSWORD не найден.${NC}"
    echo -e "${YELLOW}  Укажите SMTP_PASSWORD при запуске deploy-server.sh или заполните EMAIL_HOST_PASSWORD в $ENV_PROD_FILE${NC}"
    exit 1
fi

# SMTP and notification settings (apply to both env files)
for target in "$ENV_FILE" "$ENV_PROD_FILE"; do
    set_env "EMAIL_HOST" "smtp.beget.com" "$target"
    set_env "EMAIL_PORT" "465" "$target"
    set_env "EMAIL_USE_SSL" "True" "$target"
    set_env "EMAIL_USE_TLS" "False" "$target"
    set_env "EMAIL_HOST_USER" "$SMTP_USER" "$target"
    set_env "EMAIL_HOST_PASSWORD" "$SMTP_PASSWORD" "$target"
    set_env "DEFAULT_FROM_EMAIL" "noreply@lider-garant.ru" "$target"
    set_env "SERVER_EMAIL" "noreply@lider-garant.ru" "$target"
    set_env "FRONTEND_URL" "https://lk.lider-garant.ru" "$target"
    set_env "LEAD_NOTIFICATION_EMAIL_ENABLED" "True" "$target"
    set_env "LEAD_NOTIFICATION_EMAILS" "info@lider-garant.ru,geo3414@yandex.ru" "$target"
    set_env "REGISTRATION_NOTIFICATION_EMAIL_ENABLED" "True" "$target"
    set_env "REGISTRATION_NOTIFICATION_EMAILS" "info@lider-garant.ru,geo3414@yandex.ru" "$target"
    set_env "EMAIL_OUTBOX_MAX_ATTEMPTS" "30" "$target"
    set_env "EMAIL_OUTBOX_BATCH_SIZE" "50" "$target"
    set_env "EMAIL_OUTBOX_WORKER_SLEEP_SECONDS" "10" "$target"
    set_env "EMAIL_OUTBOX_SENT_RETENTION_DAYS" "14" "$target"
    set_env "EMAIL_OUTBOX_FAILED_RETENTION_DAYS" "90" "$target"
    set_env "EMAIL_OUTBOX_RETRY_DELAYS_SECONDS" "30,120,300,900,1800,3600,7200,21600" "$target"
    set_env "ALLOWED_HOSTS" ".lider-garant.ru,lider-garant.ru,www.lider-garant.ru,lk.lider-garant.ru,${SERVER_PUBLIC_IP},localhost,127.0.0.1,backend,lider_prod_backend,landing,lider_prod_landing,frontend,lider_prod_frontend,nginx,lider_prod_nginx" "$target"
    set_env "NEXT_PUBLIC_API_URL" "https://${LANDING_DOMAIN}/api" "$target"
    set_env "INTERNAL_API_URL" "http://backend:8000/api" "$target"
    set_env "NEXT_PUBLIC_SITE_URL" "https://${LANDING_DOMAIN}" "$target"
    set_env "SKIP_SEO_FETCH" "0" "$target"
done

chmod 600 "$ENV_FILE" "$ENV_PROD_FILE" 2>/dev/null || true

echo -e "${GREEN}✓ Переменные окружения настроены${NC}"
echo ""

# =============================================================================
# Шаг 4: Проверка/получение SSL сертификатов (Let's Encrypt)
# =============================================================================
echo -e "${YELLOW}Шаг 4: Настройка SSL сертификатов...${NC}"

CERT_PATH="$PROJECT_DIR/certbot/conf/live/lider-garant.ru"

if [ -f "$CERT_PATH/fullchain.pem" ] && [ -f "$CERT_PATH/privkey.pem" ]; then
    echo "SSL сертификаты уже существуют"
    
    # Check certificate expiry
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH/fullchain.pem" 2>/dev/null | cut -d= -f2)
    echo "Срок действия сертификата: $EXPIRY"
    
    # Copy certificates for nginx (not symlinks - Docker can't follow host symlinks)
    mkdir -p "$PROJECT_DIR/nginx/ssl"
    cp -f "$CERT_PATH/fullchain.pem" "$PROJECT_DIR/nginx/ssl/fullchain.pem"
    cp -f "$CERT_PATH/privkey.pem" "$PROJECT_DIR/nginx/ssl/privkey.pem"
    chmod 644 "$PROJECT_DIR/nginx/ssl/fullchain.pem"
    chmod 600 "$PROJECT_DIR/nginx/ssl/privkey.pem"
    
    USE_SSL=true
else
    echo "SSL сертификаты не найдены. Получаем через Let's Encrypt..."
    
    # Create directories
    mkdir -p "$PROJECT_DIR/certbot/conf"
    mkdir -p "$PROJECT_DIR/certbot/www"
    mkdir -p "$PROJECT_DIR/nginx/ssl"
    
    # Stop any running nginx
    docker stop lider_prod_nginx 2>/dev/null || true
    
    # Start temporary nginx for ACME challenge
    echo "Запуск временного nginx для получения сертификата..."
    docker run -d --rm --name certbot_nginx \
        -p 80:80 \
        -v "$PROJECT_DIR/nginx/nginx-init.conf:/etc/nginx/nginx.conf:ro" \
        -v "$PROJECT_DIR/certbot/www:/var/www/certbot:ro" \
        nginx:alpine
    
    sleep 3
    
    # Get certificate from Let's Encrypt
    echo "Запрос сертификата у Let's Encrypt..."
    docker run --rm \
        -v "$PROJECT_DIR/certbot/conf:/etc/letsencrypt" \
        -v "$PROJECT_DIR/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d lider-garant.ru \
        -d www.lider-garant.ru \
        -d lk.lider-garant.ru
    
    # Stop temporary nginx
    docker stop certbot_nginx 2>/dev/null || true
    
    if [ -f "$CERT_PATH/fullchain.pem" ]; then
        echo -e "${GREEN}✓ SSL сертификаты успешно получены!${NC}"
        
        # Copy certificates for nginx (not symlinks - Docker can't follow host symlinks)
        cp -f "$CERT_PATH/fullchain.pem" "$PROJECT_DIR/nginx/ssl/fullchain.pem"
        cp -f "$CERT_PATH/privkey.pem" "$PROJECT_DIR/nginx/ssl/privkey.pem"
        chmod 644 "$PROJECT_DIR/nginx/ssl/fullchain.pem"
        chmod 600 "$PROJECT_DIR/nginx/ssl/privkey.pem"
        
        USE_SSL=true
    else
        echo -e "${RED}✗ Не удалось получить SSL сертификаты${NC}"
        echo "Проверьте, что домены lider-garant.ru, www.lider-garant.ru, lk.lider-garant.ru"
        echo "направлены на IP адрес этого сервера (${SERVER_PUBLIC_IP})"
        echo ""
        echo "Создаем временный self-signed сертификат..."
        
        openssl req -x509 -nodes -days 90 -newkey rsa:2048 \
            -keyout "$PROJECT_DIR/nginx/ssl/privkey.pem" \
            -out "$PROJECT_DIR/nginx/ssl/fullchain.pem" \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=LiderGarant/OU=IT/CN=lider-garant.ru"
        
        USE_SSL=true
        echo -e "${YELLOW}Временный сертификат создан. Перезапустите скрипт после настройки DNS.${NC}"
    fi
fi

echo ""

# =============================================================================
# Шаг 5: Остановка контейнеров (БЕЗ удаления volumes!)
# =============================================================================
echo -e "${YELLOW}Шаг 5: Остановка контейнеров...${NC}"

cd "$PROJECT_DIR"

# Stop only our containers, preserve volumes (database!)
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Note: We do NOT use "docker compose down -v" - that would delete the database!
# If you need to wipe DB, use RESET_DB=true (see Step 5.5)

echo -e "${GREEN}✓ Контейнеры остановлены${NC}"
echo ""

# =============================================================================
# Шаг 5.5: CLEAN DEPLOY - Полная очистка (БД по умолчанию сохраняется)
# =============================================================================
echo -e "${YELLOW}Шаг 5.5: Полная очистка для сброса браузерного кэша...${NC}"

# Сохраняем важные файлы перед очисткой
echo "Сохраняем конфигурацию и сертификаты..."

# Backup .env file
BACKUP_DIR="/tmp/lider_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "$PROJECT_DIR/.env" ]; then
    cp "$PROJECT_DIR/.env" "$BACKUP_DIR/.env"
    echo "  ✓ .env сохранен"
fi

if [ -f "$PROJECT_DIR/.env.prod" ]; then
    cp "$PROJECT_DIR/.env.prod" "$BACKUP_DIR/.env.prod"
    echo "  ✓ .env.prod сохранен"
fi

# Backup SSL certificates
if [ -d "$PROJECT_DIR/certbot" ]; then
    cp -r "$PROJECT_DIR/certbot" "$BACKUP_DIR/certbot"
    echo "  ✓ SSL сертификаты сохранены"
fi

if [ -d "$PROJECT_DIR/nginx/ssl" ]; then
    mkdir -p "$BACKUP_DIR/nginx"
    cp -r "$PROJECT_DIR/nginx/ssl" "$BACKUP_DIR/nginx/ssl"
    echo "  ✓ Nginx SSL сохранен"
fi

# Получаем имя volume с базой данных (сохраняем его!)
DB_VOLUME=$(docker volume ls --format '{{.Name}}' | grep -E 'postgres_data|db_data|lider.*postgres' | head -1)
if [ -n "$DB_VOLUME" ]; then
    if [ "$RESET_DB" = "true" ]; then
        echo -e "  ${YELLOW}⚠ База данных будет удалена (volume: $DB_VOLUME)${NC}"
    else
        echo -e "  ${GREEN}✓ База данных будет сохранена в volume: $DB_VOLUME${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ Volume с базой данных не найден (возможно, первый запуск)${NC}"
fi

if [ "$RESET_DB" = "true" ]; then
    echo -e "${YELLOW}Удаляем volume базы данных...${NC}"
    if [ -n "$DB_VOLUME" ]; then
        docker volume rm "$DB_VOLUME" 2>/dev/null || true
        echo -e "${GREEN}✓ Volume базы данных удален${NC}"
    else
        echo -e "${YELLOW}⚠ Volume с базой данных не найден, удаление пропущено${NC}"
    fi
fi

# Удаляем все Docker images проекта (принудительная пересборка)
echo "Удаляем Docker images проекта..."
docker images --format '{{.Repository}}:{{.Tag}}' | grep -E 'lider|vashmarketolog|landing|cabinet|backend' | xargs -r docker rmi -f 2>/dev/null || true

# Удаляем все неиспользуемые images и build cache
echo "Очищаем Docker build cache..."
docker builder prune -af 2>/dev/null || true
docker image prune -af 2>/dev/null || true

# Переходим в безопасное место перед удалением (чтобы не потерять текущую директорию)
cd /root

# Полностью удаляем директорию проекта (кроме volume с БД который хранится отдельно Docker'ом)
echo "Удаляем файлы проекта..."
rm -rf "$PROJECT_DIR"

# Воссоздаем директорию и клонируем репозиторий заново
echo "Клонируем свежий репозиторий..."
git clone --branch "$GIT_BRANCH" --single-branch "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Восстанавливаем сохраненные файлы
echo "Восстанавливаем конфигурацию..."

if [ -f "$BACKUP_DIR/.env" ]; then
    cp "$BACKUP_DIR/.env" "$PROJECT_DIR/.env"
    echo "  ✓ .env восстановлен"
fi

if [ -f "$BACKUP_DIR/.env.prod" ]; then
    cp "$BACKUP_DIR/.env.prod" "$PROJECT_DIR/.env.prod"
    echo "  ✓ .env.prod восстановлен"
fi

if [ -d "$BACKUP_DIR/certbot" ]; then
    cp -r "$BACKUP_DIR/certbot" "$PROJECT_DIR/certbot"
    echo "  ✓ SSL сертификаты восстановлены"
fi

if [ -d "$BACKUP_DIR/nginx/ssl" ]; then
    mkdir -p "$PROJECT_DIR/nginx"
    cp -r "$BACKUP_DIR/nginx/ssl" "$PROJECT_DIR/nginx/ssl"
    echo "  ✓ Nginx SSL восстановлен"
fi

# Удаляем временный backup
rm -rf "$BACKUP_DIR"

if [ "$RESET_DB" = "true" ]; then
    echo -e "${GREEN}✓ Чистая установка подготовлена (база данных удалена)${NC}"
else
echo -e "${GREEN}✓ Чистая установка подготовлена (база данных сохранена в Docker volume)${NC}"
fi
echo ""

# =============================================================================
# Шаг 5.7: Проверка доступа к Docker Hub и предзагрузка образов
# =============================================================================
echo -e "${YELLOW}Шаг 5.7: Проверка Docker Hub и базовых образов...${NC}"

check_docker_space
configure_docker_dns

if ! curl -fsSL https://registry-1.docker.io/v2/ >/dev/null 2>&1; then
    warn "Нет доступа к registry-1.docker.io. Проверьте DNS/сеть."
fi

BASE_IMAGES=(
    "python:3.12-slim"
    "node:20-alpine"
    "nginx:alpine"
    "postgres:15-alpine"
    "redis:7-alpine"
    "certbot/certbot"
)

for image in "${BASE_IMAGES[@]}"; do
    if ! retry_pull "$image"; then
        echo -e "${RED}✗ Не удалось скачать $image. Проверьте сеть или DNS.${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Базовые образы загружены${NC}"
echo ""

# =============================================================================
# Шаг 6: Сборка и запуск
# =============================================================================
echo -e "${YELLOW}Шаг 6: Сборка и запуск контейнеров...${NC}"

if [ "$DISABLE_BUILDKIT" = "true" ]; then
    export DOCKER_BUILDKIT=0
    export COMPOSE_DOCKER_CLI_BUILD=0
    echo -e "${YELLOW}BuildKit отключен для сборки${NC}"
fi

docker compose -f docker-compose.prod.yml up -d --build

echo -e "${GREEN}✓ Контейнеры запущены${NC}"
echo ""

# =============================================================================
# Шаг 6.5: Инициализация новой базы данных (если RESET_DB=true)
# =============================================================================
if [ "$RESET_DB" = "true" ]; then
    echo -e "${YELLOW}Шаг 6.5: Инициализация базы данных...${NC}"
    echo "Ожидание готовности базы данных..."
    sleep 15
    docker compose -f docker-compose.prod.yml exec -T backend python manage.py migrate --noinput
    docker compose -f docker-compose.prod.yml exec -T backend python scripts/migrate_landing_to_seo.py
    docker compose -f docker-compose.prod.yml exec -T backend python manage.py shell -c "exec(open('scripts/seed_test_data.py').read())"
    echo -e "${GREEN}✓ Миграции выполнены, админ и SEO данные созданы${NC}"
    echo ""
fi

# =============================================================================
# Шаг 7: Ожидание готовности сервисов
# =============================================================================
echo -e "${YELLOW}Шаг 7: Проверка готовности сервисов...${NC}"

# Wait for services to be ready
sleep 10

# Check container status
echo ""
echo "Статус контейнеров:"
docker compose -f docker-compose.prod.yml ps

echo ""

# Validate Django readiness/config (with retries)
DJANGO_CHECK_OK=false
for attempt in 1 2 3 4 5 6; do
    if docker compose -f docker-compose.prod.yml exec -T backend python manage.py check >/tmp/lider_django_check.log 2>&1; then
        DJANGO_CHECK_OK=true
        break
    fi
    echo -e "${YELLOW}Django check не прошел (попытка ${attempt}/6), повтор через 5s...${NC}"
    sleep 5
done

if [ "$DJANGO_CHECK_OK" = true ]; then
    echo -e "${GREEN}✓ Django check - OK${NC}"
else
    echo -e "${RED}✗ Django check не прошел.${NC}"
    cat /tmp/lider_django_check.log || true
    exit 1
fi

# Hard checks for critical services
if docker ps --format '{{.Names}}' | grep -q '^lider_prod_email_worker$'; then
    echo -e "${GREEN}✓ email_worker - запущен${NC}"
else
    echo -e "${RED}✗ email_worker не запущен. Проверьте docker compose логи.${NC}"
    docker compose -f docker-compose.prod.yml logs --tail=100 email_worker || true
    exit 1
fi

# SMTP auth readiness check (with retries)
SMTP_CHECK_OK=false
for attempt in 1 2 3 4 5; do
    if docker compose -f docker-compose.prod.yml exec -T backend python manage.py check_smtp >/tmp/lider_smtp_check.log 2>&1; then
        SMTP_CHECK_OK=true
        break
    fi
    echo -e "${YELLOW}SMTP check не прошел (попытка ${attempt}/5), повтор через 5s...${NC}"
    sleep 5
done

if [ "$SMTP_CHECK_OK" = true ]; then
    echo -e "${GREEN}✓ SMTP аутентификация - OK${NC}"
else
    echo -e "${RED}✗ SMTP не прошел проверку. Деплой остановлен для предотвращения работы без почтовых уведомлений.${NC}"
    cat /tmp/lider_smtp_check.log || true
    exit 1
fi

# Ensure lead email recipients are synchronized in DB settings
if docker compose -f docker-compose.prod.yml exec -T backend python manage.py shell -c "from apps.notifications.models import LeadNotificationSettings; s=LeadNotificationSettings.get_settings(); s.email_enabled=True; s.recipient_emails=['info@lider-garant.ru','geo3414@yandex.ru']; s.save(update_fields=['email_enabled','recipient_emails','updated_at']); print('Lead notification settings synced')" >/tmp/lider_lead_settings.log 2>&1; then
    echo -e "${GREEN}✓ Lead notification recipients synchronized${NC}"
else
    echo -e "${RED}✗ Не удалось синхронизировать настройки уведомлений о лидах.${NC}"
    cat /tmp/lider_lead_settings.log || true
    exit 1
fi

# SEO API internal readiness check (prevents 404 in landing dynamic pages)
SEO_API_OK=false
for attempt in 1 2 3 4 5; do
    if docker compose -f docker-compose.prod.yml exec -T backend python -c "import urllib.request,sys; r=urllib.request.urlopen('http://backend:8000/api/seo/pages/', timeout=10); print(r.status); sys.exit(0 if r.status==200 else 1)" >/tmp/lider_seo_api_check.log 2>&1; then
        SEO_API_OK=true
        break
    fi
    echo -e "${YELLOW}SEO API check не прошел (попытка ${attempt}/5), повтор через 5s...${NC}"
    sleep 5
done

if [ "$SEO_API_OK" = true ]; then
    echo -e "${GREEN}✓ SEO API internal check - OK${NC}"
else
    echo -e "${RED}✗ SEO API недоступен по внутреннему хосту backend. Возможны 404 на SEO-страницах.${NC}"
    cat /tmp/lider_seo_api_check.log || true
    exit 1
fi

# Landing internal API check (from landing container perspective)
LANDING_INTERNAL_API_OK=false
for attempt in 1 2 3 4 5; do
    if docker compose -f docker-compose.prod.yml exec -T landing node -e "const base=(process.env.INTERNAL_API_URL||'http://backend:8000/api'); fetch(base + '/seo/pages/', { cache: 'no-store' }).then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1));" >/tmp/lider_landing_internal_api_check.log 2>&1; then
        LANDING_INTERNAL_API_OK=true
        break
    fi
    echo -e "${YELLOW}Landing -> INTERNAL_API_URL check не прошел (попытка ${attempt}/5), повтор через 5s...${NC}"
    sleep 5
done

if [ "$LANDING_INTERNAL_API_OK" = true ]; then
    echo -e "${GREEN}✓ Landing INTERNAL_API_URL check - OK${NC}"
else
    echo -e "${RED}✗ Landing контейнер не может получить SEO API по INTERNAL_API_URL.${NC}"
    cat /tmp/lider_landing_internal_api_check.log || true
    exit 1
fi

# Check SEO admin endpoints availability (must exist, auth can be 401/403)
SEO_TEMPLATES_STATUS=$(curl -sk -H "Host: ${LANDING_DOMAIN}" -o /dev/null -w "%{http_code}" "https://127.0.0.1/api/seo/pages/templates/?name=${SEO_TEMPLATE_PROBE}" || echo "000")
if echo "$SEO_TEMPLATES_STATUS" | grep -Eq "^(200|401|403)$"; then
    echo -e "${GREEN}✓ SEO templates endpoint available (status: ${SEO_TEMPLATES_STATUS})${NC}"
else
    echo -e "${RED}✗ SEO templates endpoint missing/unhealthy (status: ${SEO_TEMPLATES_STATUS}).${NC}"
    echo "  Ожидался status 200/401/403 для /api/seo/pages/templates/"
    exit 1
fi

SEO_ADMIN_LIST_STATUS=$(curl -sk -H "Host: ${LANDING_DOMAIN}" -o /dev/null -w "%{http_code}" "https://127.0.0.1/api/seo/pages/admin-list/" || echo "000")
if echo "$SEO_ADMIN_LIST_STATUS" | grep -Eq "^(200|401|403)$"; then
    echo -e "${GREEN}✓ SEO admin-list endpoint available (status: ${SEO_ADMIN_LIST_STATUS})${NC}"
else
    echo -e "${RED}✗ SEO admin-list endpoint missing/unhealthy (status: ${SEO_ADMIN_LIST_STATUS}).${NC}"
    echo "  Ожидался status 200/401/403 для /api/seo/pages/admin-list/"
    exit 1
fi

# Warn if sitemap base URL is not provided to landing runtime
LANDING_SITE_URL_RUNTIME=$(docker compose -f docker-compose.prod.yml exec -T landing sh -lc 'printf "%s" "${NEXT_PUBLIC_SITE_URL:-}"' 2>/dev/null || true)
if [ -n "$LANDING_SITE_URL_RUNTIME" ]; then
    echo -e "${GREEN}✓ NEXT_PUBLIC_SITE_URL в landing: ${LANDING_SITE_URL_RUNTIME}${NC}"
else
    warn "NEXT_PUBLIC_SITE_URL пуст в landing контейнере. sitemap.xml может содержать localhost URL."
fi

# End-to-end SEO page render check
if [ "$ENABLE_SEO_SMOKE_CHECK" = "true" ]; then
    SEO_SLUG="${SEO_SLUG_PROBE}"
    SEO_SLUG_FROM_API=$(docker compose -f docker-compose.prod.yml exec -T backend python -c "import json,urllib.request; data=json.loads(urllib.request.urlopen('http://backend:8000/api/seo/pages/', timeout=10).read().decode()); print(data[0].get('slug','') if isinstance(data,list) and len(data)>0 else '')" 2>/tmp/lider_seo_slug_probe.log || true)
    if [ -n "$SEO_SLUG_FROM_API" ]; then
        SEO_SLUG="$SEO_SLUG_FROM_API"
    fi

    SEO_PAGE_OK=false
    for attempt in 1 2 3 4 5; do
        SEO_PAGE_STATUS=$(curl -skL -H "Host: ${LANDING_DOMAIN}" -o /tmp/lider_seo_page_check.html -w "%{http_code}" "https://127.0.0.1/${SEO_SLUG}" || echo "000")

        if [ "$SEO_PAGE_STATUS" = "200" ] && ! grep -q "Страница не найдена" /tmp/lider_seo_page_check.html; then
            SEO_PAGE_OK=true
            break
        fi

        echo -e "${YELLOW}SEO render check не прошел для /${SEO_SLUG} (status: ${SEO_PAGE_STATUS}, попытка ${attempt}/5). Повтор через 5s...${NC}"
        sleep 5
    done

    if [ "$SEO_PAGE_OK" = true ]; then
        echo -e "${GREEN}✓ SEO public page render check - OK (/${SEO_SLUG})${NC}"
    else
        echo -e "${RED}✗ SEO public page render check failed (/${SEO_SLUG}).${NC}"
        echo "  Страница отдает 404-контент или недоступна."
        head -n 20 /tmp/lider_seo_page_check.html 2>/dev/null || true
        exit 1
    fi
fi

# Process pending outbox once to validate command and flush immediate queue
if docker compose -f docker-compose.prod.yml exec -T backend python manage.py process_email_outbox --batch-size 20 >/tmp/lider_outbox_once.log 2>&1; then
    echo -e "${GREEN}✓ Email outbox batch processed${NC}"
else
    echo -e "${RED}✗ Не удалось обработать email outbox batch.${NC}"
    cat /tmp/lider_outbox_once.log || true
    exit 1
fi

# Test endpoints
echo "Проверка доступности:"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:80 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ HTTP (port 80) - OK${NC}"
else
    echo -e "${YELLOW}⚠ HTTP (port 80) - проверьте логи${NC}"
fi

if curl -sk -o /dev/null -w "%{http_code}" https://localhost:443 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ HTTPS (port 443) - OK${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS (port 443) - проверьте логи${NC}"
fi

echo ""

# =============================================================================
# Завершение
# =============================================================================
echo -e "${GREEN}=== ДЕПЛОЙ ЗАВЕРШЕН ===${NC}"
echo ""
echo "Приложение доступно по адресам:"
echo -e "  ${GREEN}https://lider-garant.ru${NC}     - Лендинг"
echo -e "  ${GREEN}https://lk.lider-garant.ru${NC}  - Личный кабинет"
echo ""
echo "Полезные команды:"
echo "  Логи:     docker compose -f docker-compose.prod.yml logs -f"
echo "  SMTP:     docker compose -f docker-compose.prod.yml exec -T backend python manage.py check_smtp"
echo "  Worker:   docker compose -f docker-compose.prod.yml logs -f email_worker"
echo "  Статус:   docker compose -f docker-compose.prod.yml ps"
echo "  Рестарт:  docker compose -f docker-compose.prod.yml restart"
echo ""
echo "База данных:"
echo "  Volume 'postgres_data' сохраняется между деплоями (RESET_DB=true удаляет volume)"
echo "  Для backup: docker exec lider_prod_db pg_dump -U postgres lider_garant > backup.sql"
echo ""

# Show SSL certificate info
if [ -f "$CERT_PATH/fullchain.pem" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT_PATH/fullchain.pem" | cut -d= -f2)
    echo "SSL сертификат действителен до: $EXPIRY"
    echo "Сертификат будет автоматически обновляться контейнером certbot"
fi
