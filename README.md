# OCD Live — Site officiel « L'Opportunité C'est Dehors »

Site vitrine + tunnel de réservation + tableau de bord régie d'OCD Live, le service de lives TikTok imaginé par **Bovann** (Kuekam Tenan Vaneck Borel), organisé par **House of Challenge** et **BOVANN GROUP** (Lomé, Togo).

## Contenu du package

```
ocd-live-site/
├── index.html              ← page d'accueil : hero, bio Bovann, étapes, packages, contact
├── reservation.html        ← page de réservation : assistant en 6 étapes + confirmation
├── admin.html              ← espace régie : tableau de bord (connexion, stats, réservations, créneaux, paramètres)
├── css/
│   ├── style.css           ← design system partagé : couleurs, thèmes, header, boutons, calendrier, modal
│   ├── resa.css            ← styles propres à l'assistant de réservation (stepper, étapes, paiement)
│   └── admin.css           ← styles du tableau de bord régie (login, stats, table, graphiques)
├── js/
│   ├── main.js             ← accueil : globe 3D animé, révélations au scroll, thème
│   ├── resa.js             ← réservation : stepper, calendrier, créneaux, validation, paiement simulé
│   └── admin.js            ← régie : connexion, statistiques, gestion des réservations et des créneaux, exports
├── assets/
│   ├── logo-ocd.png        ← logo OCD (fond transparent) — utilisé sur toutes les pages
│   ├── portrait-bovann.jpg ← photo de présentation (section Bovann)
│   └── photo-bovann-2.jpg  ← seconde photo (polaroid)
└── README.md               ← ce guide
```

**Aucune dépendance externe** : pas de CDN, pas de bibliothèque téléchargée. Le site fonctionne hors ligne et charge instantanément.

## Points forts

- **Tunnel de réservation en 6 étapes** sur une page dédiée : Mode → Date → Créneau → Package → Vos infos → Paiement, avec le **suivi des étapes en haut** (stepper cliquable pour revenir en arrière), un récapitulatif des choix qui se construit au fil des étapes, et un **paiement simulé** (Mobile Money T-Money/Flooz ou carte bancaire) qui aboutit à un écran de confirmation avec référence de réservation.
- **Tableau de bord régie** (`admin.html`) : connexion par code, statistiques d'activité, gestion complète des réservations (statut, contact WhatsApp, export CSV/JSON), gestion des créneaux (jours complets/fermés répercutés sur le calendrier public) et paramètres. Voir la section 4.
- **Thème clair par défaut, thème sombre au choix** — bouton lune/soleil, choix mémorisé sur l'appareil, partagé entre toutes les pages.
- **Responsive complet** — testé de 320 px à 1920 px : aucune coupure, aucun débordement.
- **Palette fidèle au logo** — couleurs échantillonnées du logo OCD (voir « Palette officielle »).
- **Pré-sélection intelligente** — les boutons de l'accueil ouvrent la réservation avec le mode ou le package déjà choisi (ex. `reservation.html?mode=presentiel`).

---

## 1. Lancer le site en local

### Option A — Double-clic (la plus simple, 0 installation)

Ouvrez `index.html` dans votre navigateur (double-clic, ou clic droit → *Ouvrir avec*). La réservation s'ouvre via les boutons **« Réserver »**, les cartes de mode ou les boutons **« Choisir »** des packages.

Aucune connexion internet n'est nécessaire. **Gardez les dossiers `css/`, `js/` et `assets/` à côté des trois pages HTML** : ne séparez pas les fichiers.

### Option B — Serveur local (comportement identique à la mise en ligne)

**Avec Python** :

```bash
cd ocd-live-site
python3 -m http.server 8000
```

Puis ouvrez **http://localhost:8000**. Arrêtez avec `Ctrl+C`.

**Avec Node.js** : `npx serve .`
**Avec VS Code** : extension *Live Server* → clic droit sur `index.html` → *Open with Live Server*.

---

## 2. Mettre le site en ligne

Site 100 % statique : **n'importe quel hébergeur fonctionne**. Téléversez **le contenu complet du dossier `ocd-live-site/`** (les 3 pages HTML + `css/` + `js/` + `assets/`).

### Option 1 — Netlify Drop (≈ 2 minutes, sans carte bancaire)

1. Allez sur **https://app.netlify.com/drop**
2. Glissez-déposez le **dossier `ocd-live-site`** entier.
3. Le site est en ligne immédiatement (`https://votre-site.netlify.app`). Créez un compte gratuit pour le conserver et renommer l'URL.

### Option 2 — GitHub Pages (gratuit, permanent)

1. Créez un compte sur **https://github.com** puis un dépôt public (ex. `ocd-live`).
2. *Add file → Upload files* : déposez **tous les fichiers et dossiers**, puis *Commit changes*.
3. *Settings → Pages* → branche `main` → Save. Après 1–2 minutes : `https://votre-nom.github.io/ocd-live/`

### Option 3 — Vercel

Compte sur **https://vercel.com** → *Add New → Project* → importez le dépôt GitHub. Aucun réglage (site statique). URL : `https://ocd-live.vercel.app`.

### Option 4 — Hébergement classique (OVH, o2switch, Hostinger, LWS…)

Gestionnaire de fichiers ou FTP (FileZilla) → ouvrez `public_html` / `www` / `htdocs` → téléversez **tout le contenu du dossier** : `index.html` et `reservation.html` à la racine, avec `css/`, `js/`, `assets/` tels quels.

> **Nom de domaine personnalisé** : *Settings → Domains* chez Netlify/Vercel, ou *Settings → Pages → Custom domain* sur GitHub Pages, ou faites pointer les DNS de votre registrar vers l'hébergeur.

---

## 3. Comment fonctionne la réservation

1. Depuis l'accueil, un bouton **Réserver**, une carte de mode ou un bouton **Choisir** de package ouvre `reservation.html` (avec le mode ou le package pré-sélectionné grâce aux paramètres d'URL `?mode=presentiel|distance` et `?package=live-express|live-plus|demi-journee|journee|promo-bovann|pass-mensuel`).
2. Chaque étape se valide avec le bouton **Continuer** (bloqué tant que rien n'est choisi) ; les étapes déjà validées sont cliquables dans le stepper pour y revenir. Changer de date remet le créneau à zéro.
3. L'étape **Vos infos** vérifie nom, numéro WhatsApp et produit ; l'étape **Paiement** propose Mobile Money (T-Money/Flooz) ou carte bancaire (numéro, expiration, CVC formatés automatiquement).
4. Le bouton **Payer** déclenche une simulation de traitement, puis affiche la **confirmation** : référence unique (ex. `OCD-BXWYHC`), résumé complet et bouton WhatsApp avec message pré-rempli.

> ⚠️ **Le paiement est une simulation** (aucun débit réel, aucune donnée envoyée) : c'est une maquette fonctionnelle du tunnel. Pour encaisser réellement, il faudra brancher un prestataire de paiement (CinetPay, PayDunya, Stripe…) — le point de branchement est la fonction du bouton Payer dans `js/resa.js`. Chaque réservation confirmée est **enregistrée dans le tableau de bord régie** (voir section 4).

---

## 4. Le tableau de bord régie (`admin.html`)

L'espace d'administration de l'équipe House of Challenge. **Accès** : lien « Espace régie » dans le pied de page de l'accueil, ou ouvrez directement `admin.html`. **Code d'accès (démo) : `OCD2026`** — modifiable dans `js/admin.js` (constante `CODE`).

### Ce qu'il contient

- **Vue d'ensemble** : réservations totales, recettes confirmées, taux d'occupation des créneaux, prochain live planifié, graphique des réservations par package, remplissage jour par jour (cliquez une colonne pour gérer ce jour) et dernières réservations.
- **Réservations** : tableau complet avec recherche (nom, produit, référence), filtre par statut, changement de statut (Confirmée / En attente / Annulée), fiche détaillée, **bouton WhatsApp par client** (message pré-rempli), suppression (double clic de confirmation) et **export CSV / JSON**.
- **Créneaux & calendrier** : calendrier de décembre 2026 avec occupation réelle de chaque jour ; cliquez un jour pour voir ses 8 créneaux (libres ou réservés, avec le nom du client) et changer son état — **complet, presque complet, fermé ou ouvert** — ce qui se répercute immédiatement sur le calendrier public de la page de réservation (sur le même navigateur).
- **Paramètres** : numéro WhatsApp affiché sur le site, rechargement du jeu de démonstration, remise à zéro des données.

### Comment les données circulent (démonstration locale)

Tout fonctionne **sans serveur**, via le stockage local du navigateur (localStorage) :

| Clé | Qui écrit | Qui lit | Contenu |
| --- | --- | --- | --- |
| `ocd-bookings` | `js/resa.js` (réservations réelles) et `js/admin.js` | `js/admin.js` | La liste des réservations (démo + réelles) |
| `ocd-cal` | `js/admin.js` (états des jours) | `js/resa.js` | Jours complets / presque complets / fermés |
| `ocd-wa` | `js/admin.js` (paramètres) | `js/main.js`, `js/resa.js` | Numéro WhatsApp affiché (surcharge locale) |

Les réservations faites depuis `reservation.html` apparaissent dans le tableau de bord avec le badge **« Nouvelle »**, y compris entre deux onglets ouverts simultanément. Un jeu de 14 réservations de démonstration est chargé à la première ouverture du tableau de bord.

> ⚠️ **Limites de la démo** : le localStorage est propre à chaque navigateur (rien n'est partagé entre visiteurs ni envoyé sur Internet) et la connexion par code est une simulation sans sécurité réelle. Pour une vraie régie multi-utilisateurs, il faudra brancher un backend (Supabase, Firebase, une API maison…) aux mêmes endroits : `saveBooking()` dans `js/resa.js` (écriture) et `loadList()` dans `js/admin.js` (lecture) — c'est le seul point de branchement nécessaire.

---

## 5. Personnaliser le site

Ouvrez les fichiers dans un éditeur (VS Code…) et utilisez **Ctrl+F**.

### Dans `index.html` (textes et liens)

| Quoi chercher | Ce que c'est |
| --- | --- |
| `wa.me/4917658443070` (2 occurrences : CTA contact + bouton flottant) | Numéro WhatsApp de la régie — remplacez par le vrai numéro, format international sans `+` ni espaces. |
| `+49 176 584 43070` | Le même numéro, en version lisible dans le pied de page. |
| `contact@ocdlive.com` | Adresse e-mail affichée dans le pied de page. |
| `reservation.html?package=` (6 occurrences) | Les liens « Choisir » des 6 packages de l'accueil. |
| `admin.html` | Le lien « Espace régie » du pied de page vers le tableau de bord. |
| `L'Opportunité C'est Dehors` | Le slogan, présent à plusieurs endroits. |

### Dans `js/resa.js` (réservation)

| Quoi chercher | Ce que c'est |
| --- | --- |
| `var PACKAGES=[` | Les 6 packages : identifiant, nom, durée, prix, contenu. **Si vous changez un prix ou un nom, modifiez-le aussi dans `index.html`** (section packages) pour rester cohérent. |
| `var SLOTS=[` | Les 8 créneaux horaires et leur statut : `free` (libre), `booked` (réservé), `last` (dernier créneau). |
| `var CAL={` | Le calendrier : `year`/`month` (11 = décembre), `full` (jours complets), `near` (presque complets), `closedDays` (fermés, avec les dimanches). Ces valeurs servent de défaut — les états modifiés depuis le tableau de bord (clé `ocd-cal`) prennent le dessus. |
| `wa.me/4917658443070` (`waNumber()`) | Le même numéro WhatsApp (message de confirmation pré-rempli). La surcharge locale du tableau de bord (clé `ocd-wa`) prend le dessus si elle existe. |

### Dans `js/admin.js` (tableau de bord régie)

| Quoi chercher | Ce que c'est |
| --- | --- |
| `var CODE='OCD2026'` | Le code d'accès à l'espace régie — changez-le ici. |
| `var DEFAULT_WA=` | Le numéro WhatsApp par défaut affiché dans les paramètres. |
| `var SEED=[` | Les 14 réservations de démonstration chargées à la première visite. |
| `var SLOT_TIMES=[` | Les 8 créneaux affichés dans la gestion des jours (identiques à `SLOTS` de `resa.js`). |

### Dans `js/main.js` (accueil)

Le globe 3D, les révélations au scroll et la bascule de thème. Rien à modifier pour un usage courant.

### Dans `css/style.css`, `css/resa.css` et `css/admin.css` (couleurs)

Toutes les couleurs sont dans le bloc `:root` et `html[data-theme="dark"]` au début de `style.css`. Modifiez `--orange` et la famille `--orange-2`, `--orange-3`, `--orange-deep` pour teinter tout le site d'un coup (les trois pages partagent ces variables).

### Remplacer le logo ou les photos

Remplacez le fichier correspondant dans `assets/` **en gardant le même nom** (ex. `assets/logo-ocd.png`). Le logo est utilisé sur toutes les pages.

### Palette officielle (échantillonnée du logo)

| Couleur | Code | Usage |
| --- | --- | --- |
| Orange OCD (médian) | `#FA4900` | Couleur principale : boutons, badge LIVE, bandeau, stepper. |
| Orange vif | `#FB6600` / `#FA5600` | Dégradés, accents. |
| Rouge-orangé profond | `#F73700` | Extrémités des dégradés, badge LIVE de l'intro. |
| Orange clair | `#FC8701` | Accents sur fond sombre. |
| Noir OCD | `#0A0908` | Fond du thème sombre, textes sur orange. |
| Crème | `#FFF9F1` | Fond du thème clair. |

---

## 6. Compatibilité

Chrome, Edge, Firefox et Safari — versions récentes (2023+). Site statique : aucune donnée collectée, aucun cookie, aucune ressource tierce. Les réservations, le choix du thème et les réglages de l'espace régie sont stockés localement (localStorage) sur l'appareil du visiteur uniquement — rien ne quitte le navigateur.

---

## 7. Crédits

Site conçu pour **OCD Live** — « L'Opportunité C'est Dehors ».
Bovann · House of Challenge · BOVANN GROUP, Lomé (Togo). © 2026. Tous droits réservés.
