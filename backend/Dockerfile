# =====================================================================
# TontineSecure — image de production du backend Laravel (php-fpm)
# =====================================================================

# --- Étape 1 : dépendances Composer (sans dev) ---
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# --- Étape 2 : image applicative ---
# PHP 8.4 : requis par composer.lock (dépendances résolues en >= 8.4.1).
FROM php:8.4-fpm AS app

# Extensions PHP requises par Laravel + MySQL.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev libpng-dev libonig-dev unzip \
    && docker-php-ext-install pdo_mysql mbstring bcmath zip gd opcache \
    && rm -rf /var/lib/apt/lists/*

# Binaire Composer (pour l'autoload optimisé).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY --from=vendor /app/vendor ./vendor
COPY . .

RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache \
    && cp docker/entrypoint.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]
