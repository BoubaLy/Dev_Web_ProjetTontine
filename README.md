# TontineSecure — Gestion Digitale de Tontines (ROSCA)

Application mobile de digitalisation des tontines rotatives/accumulatives, avec
paiement **P2P déclaratif et validation croisée** (Wave / Orange Money).

**Stack :** React Native (Expo SDK 57) · Laravel 12 (API REST) · MySQL 8 · Sanctum

Projet académique — DIC1, Développement Web.

> 📚 **Toute la documentation est indexée dans [`GUIDE.md`](GUIDE.md)** : guide de
> présentation/démo, user stories, rôles & permissions, apprentissage Laravel & React
> Native, architecture, sources et déploiement.

---

## Structure du dépôt

```
tontinesecure/
├── backend/     API Laravel 12 (Sanctum, Services, Jobs, Notifications, Policies, tests)
├── frontend/    App React Native / Expo (design system « Opal », navigation, hooks)
├── docs/        Cahier des charges + guides (présentation, apprentissage, architecture…)
├── GUIDE.md     Point d'entrée de la documentation
└── DEPLOYMENT.md + docker-compose.yml   Déploiement (Caddy HTTPS auto + nginx + MySQL)
```

## Prérequis

| Outil     | Version    |
| --------- | ---------- |
| PHP       | 8.2+       |
| Composer  | 2.x        |
| Node.js   | 20+        |
| MySQL     | 8+         |
| Expo Go   | (mobile ou émulateur Android) |

## Lancer le back-end

```bash
cd backend
cp .env.example .env          # puis renseigner la connexion MySQL
composer install
php artisan key:generate
php artisan migrate --seed     # crée les tables + données de démo
php artisan serve              # API sur http://127.0.0.1:8000

# Dans deux terminaux séparés (jobs & tâches planifiées) :
php artisan queue:work         # rappels, clôtures, escalades RG-09
php artisan schedule:work      # déclenchement horaire des jobs planifiés
```

## Lancer le front-end

```bash
cd frontend
cp .env.example .env           # définir EXPO_PUBLIC_API_URL (voir ci-dessous)
npm install
npx expo start
```

### Configuration de l'URL de l'API (piège classique)

`EXPO_PUBLIC_API_URL` dans `frontend/.env` selon la cible :

| Cible                         | Valeur                          |
| ----------------------------- | ------------------------------- |
| Émulateur Android             | `http://10.0.2.2:8000/api/v1`   |
| Expo Go sur téléphone physique| `http://<IP-LAN-du-PC>:8000/api/v1` |
| iOS Simulateur                | `http://127.0.0.1:8000/api/v1`  |

## Convention Git

- `main` : stable / démontrable
- `develop` : intégration
- `feature/xxx` : une fonctionnalité par branche

## Comptes de démo (après `migrate --seed`)

Mot de passe commun : **`password`**. Comptes clés :
- **Awa Diop** `+221771111111` — administratrice de groupe
- **Support** `+221770000000` — super-administrateur (onglet « Admin »)
- **Modou Fall** `+221772222222` — bénéficiaire (validation croisée)

Liste complète et scénario de démo : **[docs/GUIDE-PRESENTATION.md](docs/GUIDE-PRESENTATION.md)**.
