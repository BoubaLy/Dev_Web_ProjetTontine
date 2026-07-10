#!/bin/sh
# =====================================================================
# Demarrage TontineSecure sur Railway (un seul conteneur : Caddy + php-fpm).
# Mappe les variables MySQL de Railway vers Laravel, migre, met en cache,
# puis lance php-fpm (arriere-plan) et Caddy (premier plan, sur $PORT).
# =====================================================================
set -e
cd /var/www/html

# Base de donnees : reutilise le plugin MySQL de Railway si DB_* non fourni.
export DB_CONNECTION="${DB_CONNECTION:-mysql}"
export DB_HOST="${DB_HOST:-$MYSQLHOST}"
export DB_PORT="${DB_PORT:-$MYSQLPORT}"
export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"

mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
         storage/logs storage/app/private storage/app/public
chown -R www-data:www-data storage bootstrap/cache || true

# Attendre la base (premier demarrage).
if [ -n "$DB_HOST" ]; then
  echo "En attente de $DB_HOST:${DB_PORT:-3306}..."
  for i in $(seq 1 30); do
    if php -r "exit(@fsockopen(getenv('DB_HOST'), (int)(getenv('DB_PORT') ?: 3306)) ? 0 : 1);" 2>/dev/null; then break; fi
    sleep 2
  done
fi

php artisan migrate --force || true
# Jeu de demonstration : uniquement si RUN_SEED=true (premiere mise en ligne).
if [ "$RUN_SEED" = "true" ]; then
  php artisan db:seed --class=DemoSeeder --force || true
fi
php artisan storage:link || true
php artisan config:cache
php artisan route:cache

# php-fpm en arriere-plan, Caddy au premier plan (sert la SPA + proxy /api).
php-fpm -D
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
