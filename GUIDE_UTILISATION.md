# Guide d'utilisation — TontineSecure

Ce guide explique comment **utiliser** TontineSecure, l'application de gestion digitale de
tontines (« Natt / Mbotaay ») avec paiement déclaratif, **validation des dépôts par
l'administrateur** et **tirage au sort** transparent du bénéficiaire.

---

## 1. Accéder à l'application

L'application est **déployée en ligne** : ouvrez simplement son adresse dans votre navigateur.
Au premier accès après une période d'inactivité, le démarrage peut prendre quelques secondes.

*(Pour lancer une copie en local : `docker compose up -d --build`, puis http://localhost.)*

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
   - **Type** : *Rotative* (à chaque tour tout le monde cotise et **un membre est tiré au
     sort** pour recevoir le pot) ou *Accumulative* (**coffre-fort** : chacun épargne
     jusqu'à une **date d'échéance**, puis récupère exactement ses propres versements).
   - **Montant de cotisation / dépôt**, **fréquence** (hebdo/mensuelle), **nombre de membres**.
   - **Pénalité de retard** (1 à 2,5 %) et **délai de grâce**.
   - Pour une accumulative : la **date d'échéance** (date de la fête / du projet).
3. La tontine est créée. Le bénéficiaire n'est jamais choisi d'avance : il est tiré au sort
   après chaque collecte complète.

### Ajouter des membres (administrateur)
1. Dans le détail du groupe, **générez un code d'invitation** et partagez-le.
2. Les invités saisissent le code via **Mes tontines -> Rejoindre**.
3. Vous **validez** chaque demande d'adhésion.

### Démarrer la tontine
Quand les membres sont validés, l'administrateur **démarre la collecte** (ou l'épargne). Aucun
ordre n'est fixé à l'avance : pour une rotative, le bénéficiaire de chaque tour est **tiré au
sort** après la collecte.

---

## 5. Le cycle de cotisation (cœur de l'app)

### Tontine rotative (tirage au sort après collecte)
Le bénéficiaire n'est **pas connu à l'avance** : pour garder tout le monde motivé, il est tiré
au sort une fois la collecte terminée.

1. **Déclarer sa cotisation** : **tous** les membres effectuent leur transfert **Mobile Money**
   (Wave / Orange Money) dans le pot, puis saisissent la **référence** dans l'app. La cotisation
   passe en *déclarée · en attente*.
2. **Validation par l'administrateur** : l'admin vérifie le **dépôt réel** et passe chaque
   cotisation en *validée* — ou la **conteste** (ouverture d'un litige, membre gelé).
3. **Tirage au sort** : le bouton de tirage reste **bloqué tant que 100 % des cotisations ne
   sont pas validées**. Une fois débloqué, l'app tire au hasard un bénéficiaire **parmi ceux qui
   n'ont pas encore gagné** ce cycle.
4. **Clôture du tour** : l'admin transfère le pot au gagnant, **téléverse le reçu**, ce qui
   clôture le tour et ouvre le suivant. Quand tout le monde a gagné une fois, la tontine se termine.

### Tontine accumulative (coffre-fort / épargne Tabaski)
Aucun tirage : l'app et l'admin jouent le rôle d'un **coffre-fort numérique**.

1. **Dépôts réguliers** : chaque membre dépose un montant fixe par période ; l'admin valide
   chaque dépôt (*en attente -> validé*), remplaçant le carnet papier par un historique fiable.
2. **Fonds bloqués** jusqu'à la **date d'échéance** (la date de la fête / du projet).
3. **Restitution** : à l'échéance, l'admin lance la restitution et **chaque membre récupère
   exactement le total de ses propres versements**. Un mois manqué n'impacte que lui, pas les autres.

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
| **Membre** | Rejoindre des tontines, déclarer ses cotisations/dépôts, signaler un litige. |
| **Administrateur de groupe** | Tout membre **+** gérer son groupe (inviter, valider les adhésions, **valider les dépôts**, **tirer au sort**, **clôturer avec reçu** / restituer, arbitrer ses litiges). |
| **Super-administrateur** | Gérer la plateforme : valider les KYC, geler/dégeler des comptes, arbitrer tous les litiges. |

---

## 9. Astuces

- **Rester connecté** : la session dure 7 jours ; au rechargement vous restez sur votre tableau
  de bord (la page d'accueil publique n'apparaît que si vous êtes déconnecté — ou via
  **Profil -> Voir la page d'accueil publique**).
- **Notifications** : cloche en haut (mobile) ou onglet Notifications. Vous y êtes averti(e) :
  - quand **un membre paie** (tout le groupe voit qui a payé, le montant, la date et l'heure) ;
  - quand un **dépôt attend votre validation** (administrateur) — action prioritaire ;
  - quand **votre cotisation est validée**, quand le **pot vous est versé**, en cas de **litige** ;
  - côté **super-administrateur**, quand une **pièce KYC** est déposée et attend validation.
- **Vérifiez votre identité (KYC)** : un rappel s'affiche sur le tableau de bord tant que votre
  compte n'est pas vérifié — obligatoire pour créer ou rejoindre une tontine.
- **Un compte gelé** ne peut ni cotiser, ni recevoir, ni se connecter (le temps d'un litige).
