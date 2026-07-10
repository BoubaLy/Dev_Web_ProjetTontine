#!/bin/sh
# =====================================================================
# Démarrage du backend Laravel sur Railway (un seul conteneur :
# nginx + php-fpm, écoute sur $PORT). Mappe les variables de la base
# MySQL de Railway vers les variables Laravel, migre, met en cache, démarre.
# =====================================================================
set -e
cd /var/www/html

# --- 1. Base de données : réutilise les variables du plugin MySQL de Railway
#         si les variables DB_* ne sont pas déjà définies. ---
export DB_CONNECTION="${DB_CONNECTION:-mysql}"
export DB_HOST="${DB_HOST:-$MYSQLHOST}"
export DB_PORT="${DB_PORT:-$MYSQLPORT}"
export DB_DATABASE="${DB_DATABASE:-$MYSQLDATABASE}"
export DB_USERNAME="${DB_USERNAME:-$MYSQLUSER}"
export DB_PASSWORD="${DB_PASSWORD:-$MYSQLPASSWORD}"

# --- 2. Storage (au cas où un volume est monté vide) ---
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
         storage/logs storage/app/private storage/app/public
chown -R www-data:www-data storage bootstrap/cache || true

# --- 3. Attendre la base (premier démarrage) ---
if [ -n "$DB_HOST" ]; then
  echo "En attente de $DB_HOST:${DB_PORT:-3306}..."
  for i in $(seq 1 30); do
    if php -r "exit(@fsockopen(getenv('DB_HOST'), (int)(getenv('DB_PORT') ?: 3306)) ? 0 : 1);" 2>/dev/null; then break; fi
    sleep 2
  done
fi

# --- 4. Migrations + caches (à chaque déploiement) ---
php artisan migrate --force || true
# Jeu de démonstration : seulement si RUN_SEED=true (première mise en ligne).
if [ "$RUN_SEED" = "true" ]; then
  php artisan db:seed --class=DemoSeeder --force || true
fi
php artisan storage:link || true
php artisan config:cache
php artisan route:cache

# --- 5. Nginx sur le port fourni par Railway ---
export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/railway.conf.template > /etc/nginx/conf.d/default.conf

# --- 6. Démarrage : php-fpm en arrière-plan, nginx au premier plan ---
php-fpm -D
exec nginx -g 'daemon off;'
