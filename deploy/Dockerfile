# =====================================================================
# TontineSecure - image TOUT-EN-UN (un seul service web).
# Caddy sert la SPA React (dist/) et proxifie /api vers Laravel (php-fpm),
# le tout sur $PORT. A completer par une base (PostgreSQL sur Render,
# ou MySQL) => 2 composants au total.
# Contexte de build = racine du depot (acces a backend/ et frontend-web/).
# Support MySQL ET PostgreSQL (pdo_mysql + pdo_pgsql).
# =====================================================================

# --- Etape 1 : build du frontend (React + Vite) ---
FROM node:22-alpine AS front
WORKDIR /front
COPY frontend-web/package.json frontend-web/package-lock.json ./
RUN npm ci
COPY frontend-web/ ./
# API et front sur la meme origine -> URL relative (pas de CORS).
RUN echo "VITE_API_URL=/api/v1" > .env.production && npm run build

# --- Etape 2 : dependances Composer (sans dev) ---
FROM composer:2 AS vendor
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# --- Etape 3 : runtime PHP 8.4 + Caddy ---
FROM php:8.4-fpm AS app
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev libpng-dev libonig-dev libpq-dev unzip \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring bcmath zip gd opcache \
    && rm -rf /var/lib/apt/lists/*

# Binaire Caddy (statique) recupere depuis l'image officielle.
COPY --from=caddy:2-alpine /usr/bin/caddy /usr/bin/caddy
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY backend/ ./
RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

# SPA compilee + config Caddy + script de demarrage.
COPY --from=front /front/dist /srv
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

CMD ["/usr/local/bin/start.sh"]
