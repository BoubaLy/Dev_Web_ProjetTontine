# =====================================================================
# TontineSecure — build de la Web App (React + Vite) + Caddy (HTTPS auto)
# Caddy sert la SPA (dist/) et reverse-proxie /api → nginx (API Laravel).
# =====================================================================

# --- Étape 1 : build statique Vite ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Web et API sur la même origine (derrière Caddy) → URL relative.
RUN echo "VITE_API_URL=/api/v1" > .env.production && npm run build

# --- Étape 2 : Caddy (TLS Let's Encrypt automatique) ---
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY docker/Caddyfile /etc/caddy/Caddyfile
