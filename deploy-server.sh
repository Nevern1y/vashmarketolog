#!/bin/bash

REPO_URL="https://github.com/Nevern1y/vashmarketolog"
PROJECT_DIR="/opt/vashmarketolog"

echo "=== ДЕПЛОЙ НА СЕРВЕР 85.198.97.62 ==="
echo ""

echo "Шаг 1: Установка зависимостей..."
apt update && apt install -y git docker.io docker-compose-plugin openssl

echo ""
echo "Шаг 2: Клонирование репозитория..."
if [ -d "$PROJECT_DIR" ]; then
    echo "Обновление репозитория..."
    cd "$PROJECT_DIR"
    git fetch origin
    git reset --hard origin/main
else
    echo "Клонирование репозитория..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

echo ""
echo "Шаг 3: Создание SSL сертификатов..."
mkdir -p "$PROJECT_DIR/nginx/ssl"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$PROJECT_DIR/nginx/ssl/privkey.pem" \
  -out "$PROJECT_DIR/nginx/ssl/fullchain.pem" \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Test/OU=Test/CN=85.198.97.62"

echo ""
echo "Шаг 4: Создание .env файла..."
cat > "$PROJECT_DIR/.env" << 'ENVEOF'
SECRET_KEY=wemBIyVHZ_RJbwR99K6dlBLHG01YOn3SEjMH-zFNWpZRwaxdtmEZFcvd255wuIIfY2Q
DB_NAME=lider_garant
DB_USER=postgres
DB_PASSWORD=StrongPassword123
DB_HOST=db
DB_PORT=5432
REDIS_HOST=redis
REDIS_PORT=6379
ALLOWED_HOSTS=.lider-garant.ru,lk.lider-garant.ru,85.198.97.62,localhost
CORS_ALLOWED_ORIGINS=https://lk.lider-garant.ru,http://85.198.97.62
BANK_API_URL=https://stagebg.realistbank.ru/agent_api1_1
BANK_API_LOGIN=test_login
BANK_API_PASSWORD=test_password
SECURE_SSL_REDIRECT=False
ACCESS_TOKEN_LIFETIME_MINUTES=60
REFRESH_TOKEN_LIFETIME_DAYS=7
ENVEOF

echo ""
echo "Шаг 5: Остановка старых контейнеров..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo ""
echo "Шаг 6: Удаление конфликтующих контейнеров..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

echo ""
echo "Шаг 7: Сборка и запуск..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "Шаг 8: Проверка статуса..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== ДЕПЛОЙ ЗАВЕРШЕН ==="
echo "Приложение доступно по адресу:"
echo "  HTTP: http://85.198.97.62"
echo "  HTTPS: https://85.198.97.62"
echo ""
echo "Проверить логи:"
echo "  docker compose -f docker-compose.prod.yml logs -f"
