#!/bin/bash
set -e

# =============================================================================
# DEPLOYMENT SCRIPT FOR LIDER-GARANT VPS
# Server: 85.198.97.62 (Ubuntu 24.04)
# Domains: lider-garant.ru (landing) + lk.lider-garant.ru (dashboard)
# =============================================================================

echo "=========================================="
echo "  LIDER-GARANT VPS DEPLOYMENT SCRIPT"
echo "=========================================="

# Configuration
LANDING_REPO="https://github.com/KambievT/lider-garant.git"
DASHBOARD_REPO="https://github.com/Nevern1y/vashmarketolog.git"
LANDING_DIR="/var/www/lider-garant"
DASHBOARD_DIR="/var/www/lk-lider-garant"
LANDING_DOMAIN="lider-garant.ru"
DASHBOARD_DOMAIN="lk.lider-garant.ru"
LANDING_PORT=3000
DASHBOARD_PORT=3001
EMAIL="admin@lider-garant.ru"  # Change this to your email for Let's Encrypt

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# STEP 1: Update system and install dependencies
# =============================================================================
log_info "Step 1: Updating system and installing dependencies..."

apt update && apt upgrade -y

# Install Node.js 20.x (LTS)
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    log_info "Node.js already installed: $(node -v)"
fi

# Install nginx
if ! command -v nginx &> /dev/null; then
    log_info "Installing Nginx..."
    apt install -y nginx
else
    log_info "Nginx already installed"
fi

# Install certbot for Let's Encrypt
if ! command -v certbot &> /dev/null; then
    log_info "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
else
    log_info "Certbot already installed"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    npm install -g pm2
else
    log_info "PM2 already installed"
fi

# Install git
apt install -y git

# =============================================================================
# STEP 2: Stop existing PM2 processes
# =============================================================================
log_info "Step 2: Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# =============================================================================
# STEP 3: Clone/Update Landing (lider-garant.ru)
# =============================================================================
log_info "Step 3: Deploying Landing (lider-garant.ru)..."

if [ -d "$LANDING_DIR" ]; then
    log_info "Updating existing landing repository..."
    cd "$LANDING_DIR"
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    log_info "Cloning landing repository..."
    git clone "$LANDING_REPO" "$LANDING_DIR"
    cd "$LANDING_DIR"
fi

# Install dependencies and build
log_info "Installing landing dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

log_info "Building landing..."
npm run build

# =============================================================================
# STEP 4: Clone/Update Dashboard (lk.lider-garant.ru)
# =============================================================================
log_info "Step 4: Deploying Dashboard (lk.lider-garant.ru)..."

if [ -d "$DASHBOARD_DIR" ]; then
    log_info "Updating existing dashboard repository..."
    cd "$DASHBOARD_DIR"
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    log_info "Cloning dashboard repository..."
    git clone "$DASHBOARD_REPO" "$DASHBOARD_DIR"
    cd "$DASHBOARD_DIR"
fi

# Create .env.local for dashboard if not exists
if [ ! -f "$DASHBOARD_DIR/.env.local" ]; then
    log_info "Creating .env.local for dashboard..."
    cat > "$DASHBOARD_DIR/.env.local" << EOF
NEXT_PUBLIC_API_URL=https://api.lider-garant.ru/api
EOF
fi

# Install dependencies and build
log_info "Installing dashboard dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

log_info "Building dashboard..."
npm run build

# =============================================================================
# STEP 5: Configure Nginx (without SSL first)
# =============================================================================
log_info "Step 5: Configuring Nginx..."

# Landing nginx config
cat > /etc/nginx/sites-available/lider-garant << EOF
server {
    listen 80;
    server_name ${LANDING_DOMAIN} www.${LANDING_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${LANDING_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Dashboard nginx config
cat > /etc/nginx/sites-available/lk-lider-garant << EOF
server {
    listen 80;
    server_name ${DASHBOARD_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:${DASHBOARD_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable sites
ln -sf /etc/nginx/sites-available/lider-garant /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/lk-lider-garant /etc/nginx/sites-enabled/

# Remove default site if exists
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx

# =============================================================================
# STEP 6: Start applications with PM2
# =============================================================================
log_info "Step 6: Starting applications with PM2..."

# Start landing on port 3000
cd "$LANDING_DIR"
pm2 start npm --name "lider-garant-landing" -- start -- -p ${LANDING_PORT}

# Start dashboard on port 3001
cd "$DASHBOARD_DIR"
pm2 start npm --name "lider-garant-dashboard" -- start -- -p ${DASHBOARD_PORT}

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# =============================================================================
# STEP 7: Obtain SSL certificates with Let's Encrypt
# =============================================================================
log_info "Step 7: Obtaining SSL certificates with Let's Encrypt..."

# Wait for nginx to be ready
sleep 3

# Obtain SSL for landing domain
log_info "Obtaining SSL for ${LANDING_DOMAIN}..."
certbot --nginx -d ${LANDING_DOMAIN} -d www.${LANDING_DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect || {
    log_warn "SSL for landing failed. You may need to run manually:"
    log_warn "certbot --nginx -d ${LANDING_DOMAIN} -d www.${LANDING_DOMAIN}"
}

# Obtain SSL for dashboard domain
log_info "Obtaining SSL for ${DASHBOARD_DOMAIN}..."
certbot --nginx -d ${DASHBOARD_DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect || {
    log_warn "SSL for dashboard failed. You may need to run manually:"
    log_warn "certbot --nginx -d ${DASHBOARD_DOMAIN}"
}

# Setup auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

# =============================================================================
# STEP 8: Configure firewall
# =============================================================================
log_info "Step 8: Configuring firewall..."

ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# =============================================================================
# STEP 9: Final checks
# =============================================================================
log_info "Step 9: Running final checks..."

echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Nginx Status:"
systemctl status nginx --no-pager -l | head -5
echo ""
echo "SSL Certificates:"
certbot certificates 2>/dev/null || echo "Run 'certbot certificates' to check"
echo ""
echo "=========================================="
echo "  YOUR SITES ARE NOW LIVE:"
echo "=========================================="
echo ""
echo "  Landing:   https://${LANDING_DOMAIN}"
echo "  Dashboard: https://${DASHBOARD_DOMAIN}"
echo ""
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check app status"
echo "  pm2 logs                - View logs"
echo "  pm2 restart all         - Restart all apps"
echo "  certbot renew --dry-run - Test SSL renewal"
echo ""
