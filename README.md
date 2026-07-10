# TontineSecure — Gestion Digitale de Tontines (ROSCA)

Application de digitalisation des tontines rotatives/accumulatives (« Natt / Mbotaay »),
avec paiement **P2P déclaratif et validation croisée** (Wave / Orange Money).

**Stack :** **React + Vite** (Web app) · **Laravel 12** (API REST) · **MySQL 8** · **Sanctum**

Projet académique — DIC1, Développement Web.

> **Comment utiliser l'application : voir [`GUIDE_UTILISATION.md`](GUIDE_UTILISATION.md).**

---

## Structure du dépôt

```
tontinesecure/
├── backend/           API Laravel 12 (Sanctum, Services, Jobs, Notifications, Policies, tests)
├── frontend-web/      Web App React + Vite (design system « Opal », SPA)
├── docker-compose.yml Déploiement local (nginx + php-fpm + MySQL + Caddy)
├── README.md
└── GUIDE_UTILISATION.md
```

## Démarrage rapide (Docker)

```bash
docker compose up -d --build
```
- Application : **http://localhost**
- Migrations + données de démo chargées automatiquement.
- Comptes de démo (mot de passe `password`) : super-admin `+221770000000`,
  membre/admin `+221771111111`.

## Démarrage manuel (développement)

**Backend**
```bash
cd backend
cp .env.example .env          # renseigner la connexion MySQL
composer install
php artisan key:generate
php artisan migrate --seed    # tables + données de démo
php artisan serve             # API sur http://127.0.0.1:8000
```

**Front web**
```bash
cd frontend-web
cp .env.example .env          # VITE_API_URL (ex. http://127.0.0.1:8000/api/v1)
npm install
npm run dev                   # http://localhost:5173
```

## Convention Git
- `main` : stable / démontrable · `develop` : intégration · `feature/xxx` : une fonctionnalité par branche.

---

Pour le mode d'emploi complet (inscription, KYC, création/adhésion à une tontine, cycle de
cotisation, validation croisée, litiges, score, rôles), voir **[`GUIDE_UTILISATION.md`](GUIDE_UTILISATION.md)**.
