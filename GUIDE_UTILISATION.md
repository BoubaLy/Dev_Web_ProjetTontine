# Guide d'utilisation — TontineSecure

Ce guide explique comment **utiliser** TontineSecure, l'application de gestion digitale de
tontines (épargne rotative « Natt / Mbotaay ») avec paiement déclaratif et **validation
croisée** entre membres.

---

## 1. Lancer l'application

### En local (Docker)
```bash
docker compose up -d --build
```
- Application : **http://localhost**
- L'API et la base MySQL démarrent automatiquement (migrations + données de démo).

### Comptes de démonstration (mot de passe : `password`)
| Rôle | Téléphone |
|---|---|
| Super-administrateur | `+221770000000` |
| Membre / Admin de groupe | `+221771111111` (Awa) |
| Autres membres | `+221772222222`, `+221773333333`, … |

---

## 2. Créer un compte

1. Sur la page d'accueil, cliquez **S'inscrire**.
2. Renseignez **prénom, nom, téléphone, email, mot de passe** (wizard en 3 étapes).
3. Le compte est créé et vous êtes **connecté directement**.

> La vérification par code (OTP par email) est présente dans le code mais **désactivée
> pour cette version MVP** (`OTP_ENABLED=false`). Pour la réactiver : passer `OTP_ENABLED=true`
> et configurer un service d'envoi d'emails (`MAIL_*`).

---

## 3. Vérifier son identité (KYC)

Certaines actions exigent une identité vérifiée.
1. **Profil -> Vérification d'identité (KYC)**.
2. Envoyez une photo de votre **CNI** ou **passeport**.
3. Un **super-administrateur** valide (ou rejette) votre pièce. Une fois validée, vous pouvez
   rejoindre et gérer des tontines.

---

## 4. Créer ou rejoindre une tontine

### Créer une tontine (vous en devenez l'administrateur)
1. **Mes tontines -> Créer** (wizard en 4 étapes).
2. Choisissez :
   - **Type** : *Rotative* (chacun reçoit le pot à son tour — la tontine classique) ou
     *Accumulative* (caisse commune épargnée ensemble).
   - **Montant de cotisation**, **fréquence** (hebdo/mensuelle), **nombre de membres**.
   - **Pénalité de retard** (1 à 2,5 %) et **délai de grâce**.
   - **Ordre de passage** : *Aléatoire* (tiré au sort) ou *Manuel* (ordre d'arrivée).
3. La tontine est créée.

### Ajouter des membres (administrateur)
1. Dans le détail du groupe, **générez un code d'invitation** et partagez-le.
2. Les invités saisissent le code via **Mes tontines -> Rejoindre**.
3. Vous **validez** chaque demande d'adhésion.

### Démarrer le cycle
Quand les membres sont validés, l'administrateur **démarre le cycle** : l'**ordre de rotation**
est généré et le **premier bénéficiaire** est désigné.

---

## 5. Le cycle de cotisation (cœur de l'app)

À chaque tour, un membre est **bénéficiaire** (il reçoit le pot). Les autres cotisent.

1. **Déclarer sa cotisation** : effectuez le transfert **Mobile Money** (Wave / Orange Money)
   au bénéficiaire, puis saisissez la **référence de la transaction** dans l'app.
2. **Validation croisée** : le **bénéficiaire** reçoit une notification et **confirme la
   réception** (la cotisation devient *validée*) — ou **conteste** (ouverture d'un litige).
3. Quand **toutes** les cotisations sont validées, l'administrateur **clôture le cycle** :
   le **pot est versé** au bénéficiaire et le tour suivant démarre automatiquement.

> Le bénéficiaire du tour ne cotise pas son propre tour. Le tableau de bord montre le
> **pot attendu** (« À recevoir ») quand c'est votre tour.

---

## 6. Litiges

En cas de problème (paiement non reçu, contestation) :
1. **Signaler un litige** depuis le détail du groupe ou l'onglet Litiges.
2. L'**administrateur du groupe** (ou un super-admin) **investigue** (le payeur peut être gelé),
   puis **résout** le litige (déblocage, validation éventuelle, recalcul du score).

---

## 7. Score de fiabilité

- Chaque membre a un **score** (0–100) qui reflète la ponctualité de ses cotisations.
- Badge : Fiable (≥ 90) · Correct (70–89) · À risque (< 70).
- Un bon score inspire confiance aux groupes. Visible sur le **Profil** et le **tableau de bord**.

---

## 8. Rôles

| Rôle | Peut… |
|---|---|
| **Membre** | Rejoindre des tontines, cotiser, confirmer/contester, signaler un litige. |
| **Administrateur de groupe** | Tout membre **+** gérer son groupe (inviter, valider, démarrer/clôturer les cycles, arbitrer ses litiges). |
| **Super-administrateur** | Gérer la plateforme : valider les KYC, geler/dégeler des comptes, arbitrer tous les litiges. |

---

## 9. Astuces

- **Rester connecté** : la session dure 7 jours ; au rechargement vous restez sur votre tableau
  de bord (la page d'accueil publique n'apparaît que si vous êtes déconnecté — ou via
  **Profil -> Voir la page d'accueil publique**).
- **Notifications** : cloche en haut (mobile) ou onglet Notifications — les actions à faire
  (confirmer un paiement) y apparaissent en priorité.
- **Un compte gelé** ne peut ni cotiser, ni recevoir, ni se connecter (le temps d'un litige).
