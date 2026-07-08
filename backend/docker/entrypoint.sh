#!/bin/sh
set -e

cd /var/www/html

# Garantir l'arborescence de storage (nécessaire quand un volume nommé la monte).
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views \
         storage/logs storage/app/private storage/app/public
chown -R www-data:www-data storage bootstrap/cache

# Attendre que la base soit joignable (utile au premier démarrage du compose).
if [ -n "$DB_HOST" ]; then
  echo "En attente de la base $DB_HOST:${DB_PORT:-3306}..."
  for i in $(seq 1 30); do
    if php -r "exit(@fsockopen(getenv('DB_HOST'), (int)(getenv('DB_PORT') ?: 3306)) ? 0 : 1);" 2>/dev/null; then
      break
    fi
    sleep 2
  done
fi

# Migrations + caches de config uniquement sur le conteneur applicatif
# (pas sur les workers queue/scheduler) pour éviter les courses.
if [ "$RUN_MIGRATIONS" = "true" ]; then
  php artisan migrate --force
  php artisan storage:link || true
  php artisan config:cache
  php artisan route:cache
  php artisan event:cache || true
fi

exec "$@"
