#!/bin/sh
# =====================================================================
# Demarrage TontineSecure (un seul conteneur : nginx + php-fpm).
# La base est fournie par variables d'environnement (DB_CONNECTION=mysql sur
# Aiven, ou pgsql). Si un plugin expose MYSQL*, on les mappe vers DB_*.
# Migre, met en cache, puis lance php-fpm (arriere-plan) et nginx sur $PORT.
# =====================================================================
set -e
cd /var/www/html

# Base de donnees : reutilise MYSQL* si DB_* non fourni.
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

# Migrations. Si RUN_SEED=true : base repartie a neuf + donnees de demo
# (evite les doublons si le conteneur redemarre). Sinon : migration simple.
if [ "$RUN_SEED" = "true" ]; then
  php artisan migrate:fresh --force
  php artisan db:seed --class=DemoSeeder --force || true
else
  php artisan migrate --force || true
fi
php artisan storage:link || true
php artisan config:cache
php artisan route:cache

# nginx sur le port fourni par la plateforme.
export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/tontine.conf.template > /etc/nginx/conf.d/default.conf

# php-fpm en arriere-plan, nginx au premier plan.
php-fpm -D
exec nginx -g 'daemon off;'
