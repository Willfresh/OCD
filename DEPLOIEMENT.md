# Déploiement — OCD Live & Shop

Ce guide part de zéro : d'abord un test en local (5 minutes), puis la mise en ligne
sur **Vercel** (recommandé, ~10 minutes), puis les alternatives (Railway, Render, VPS).

---

## 0. Prérequis

- **Node.js 20 ou plus** (testé avec Node 22) — ou **Bun** si vous préférez.
- Un compte **GitHub** (pour envoyer le code sur Vercel).
- Pour la production : un compte **Vercel** (gratuit) et un compte **Neon** (base PostgreSQL, offre gratuite) — voir l'étape 2.

---

## 1. Test en local (SQLite, zéro configuration)

```bash
# 1) Installer les dépendances
npm install

# 2) Copier l'exemple d'environnement
cp .env.example .env        # DATABASE_URL="file:./dev.db"
#    Windows (PowerShell) :  Copy-Item .env.example .env

# 3) Créer la base et insérer les données de démonstration
npm run db:push             # crée prisma/dev.db avec toutes les tables
npm run db:seed             # comptes, boutiques, produits, lives, commandes (badges « DÉMO »)

# 4) Démarrer
npm run dev                 # → http://localhost:3000
```

> **Ordre important** : créez le fichier `.env` (étape 2) **avant** `db:push` et `db:seed`.
> Sans `DATABASE_URL`, Prisma ne peut ni valider le schéma (`P1012`), ni générer le client
> (`@prisma/client did not initialize yet`) — toutes les routes API renverraient alors une erreur 500.
> Si cela arrive : créez le `.env`, puis relancez `npm run db:push && npm run db:seed`.

> **npm audit (3 vulnérabilités « high »)** : elles concernent uniquement l'outillage de
> développement (CLI Prisma → `deepmerge-ts`) et **pas le site livré** — `@prisma/client`, le
> code applicatif et la base ne sont pas affectés. Vous pouvez les ignorer en local ; ne forcez
> pas `npm audit fix --force` (il casserait les versions de Prisma).

Connexion de test : **régie** `regie@ocd.live` / `OCD2026` — vendeurs démo `xxx@demo.ocd` / `demo1234`.
Build production local : `npm run build` puis `npm start`.

> SQLite convient parfaitement à un usage local, en démo ou sur un serveur avec disque
> (VPS). En revanche, sur Vercel/Netlify le système de fichiers est en **lecture seule** :
> les inscriptions, commandes et soumissions de lives échoueraient. D'où l'étape 2.

---

## 2. Mise en ligne sur Vercel (recommandé)

Le principe : le site tourne sur Vercel, la base sur **Neon** (PostgreSQL gratuit,
1 commande de création). Toutes les fonctionnalités (inscriptions, commandes,
soumission de lives, espace régie) fonctionnent.

### 2.1 Créer la base Neon

1. Créez un compte sur **https://neon.tech** (connexion Google/GitHub possible).
2. « **New Project** » → region : choisissez l'Europe (`eu-central-1` ou `eu-west`)
   pour une latence correcte depuis l'Afrique de l'Ouest → PostgreSQL 17 par défaut, c'est bon.
3. Sur le tableau de bord, bouton **« Connection string »** → copiez l'URL :
   `postgresql://user:password@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`

### 2.2 Basculer le projet sur PostgreSQL (2 lignes à changer)

1. Dans **`prisma/schema.prisma`**, remplacez le provider :

   ```prisma
   datasource db {
     provider = "postgresql"   // était "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Dans **`.env`** (local), remplacez `DATABASE_URL` par l'URL Neon copiée.

### 2.3 Créer les tables et les remplir (depuis votre machine)

```bash
npm run db:push      # crée le schéma dans la base Neon
npm run db:seed      # insère les données de démo dans la même base
```

> `db:seed` charge automatiquement le fichier `.env` (le script embarque `dotenv`).
> Vérification rapide : dans la console Neon (« Tables »), les tables `User`, `Shop`,
> `Product`… contiennent des lignes.

### 2.4 Envoyer le code sur GitHub

```bash
git init
git add .
git commit -m "OCD Live & Shop — initial"
git branch -M main
git remote add origin https://github.com/<votre-compte>/ocd-live-shop.git
git push -u origin main
```

(Le `.gitignore` fourni exclut `.env`, `node_modules`, `.next` et la base SQLite —
rien de confidentiel n'est poussé.)

### 2.5 Importer dans Vercel

1. **https://vercel.com/new** → « Import Git Repository » → choisissez le dépôt.
2. Framework : détecté automatiquement (**Next.js**) — ne touchez ni au build ni à la commande de démarrage
   (`npm run build` lance déjà `prisma generate && next build`).
3. « **Environment Variables** » → ajoutez :

   | Clé | Valeur |
   | --- | --- |
   | `DATABASE_URL` | l'URL Neon complète (`postgresql://…?sslmode=require`) |

4. **Deploy**. Une à deux minutes plus tard le site est en ligne
   (`https://ocd-live-shop-<votre-compte>.vercel.app`).

### 2.5 bis Après la mise en ligne : créer le compte régie « réel »

Le compte `regie@ocd.live` est un compte de **démonstration** (badge DÉMO visible dans
l'espace régie). Pour un vrai usage :

1. Connectez-vous sur le site avec n'importe quel compte, puis créez un compte
   « propre » via Inscription avec votre e-mail réel ;
2. Passez-le ADMIN directement dans la base — console Neon → SQL :

   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'vous@exemple.com';
   ```

3. Reconnectez-vous : le menu « Espace régie » s'active.

### 2.6 Mises à jour

- Modifiez le code → `git push` → Vercel redéploie automatiquement.
- Changement de schéma Prisma → en local : `npm run db:push` (avec le `.env`
  pointant sur Neon), puis `git push`.

---

## 3. Alternatives d'hébergement

### Railway (le plus simple après Vercel)

1. Nouveau projet → **Provision PostgreSQL** → copier la `DATABASE_URL` publique.
2. Même bascule que § 2.2 (provider `postgresql` + `.env`).
3. `npm run db:push && npm run db:seed` en local vers cette base.
4. GitHub → Railway « Deploy from repo », variable `DATABASE_URL`, c'est tout.

### Render (offre gratuite)

- Type **Web Service** → Build : `npm install && npm run build` → Start : `npm start`.
- Créez un **Render PostgreSQL** et utilisez sa *Internal Database URL* dans `DATABASE_URL`.
- Bascule Prisma + `db:push`/`db:seed` identiques à § 2.2–2.3.
- À savoir : l'offre gratuite « s'endort » après 15 min d'inactivité (première requête lente).

### VPS / serveur propre (Ubuntu — SQLite autorisé, il y a un disque)

Sur un VPS (Hetzner, Contabo, OVH…), SQLite fonctionne très bien :

```bash
git clone https://github.com/<vous>/ocd-live-shop.git && cd ocd-live-shop
npm install
cp .env.example .env            # gardez SQLite : DATABASE_URL="file:./dev.db"
npm run db:push && npm run db:seed
npm run build
npm i -g pm2 && pm2 start npm --name ocd -- start   # tourne en arrière-plan
```

Puis mettez un reverse proxy HTTPS devant (port 3000) :

```nginx
# /etc/nginx/sites-available/ocd
server {
  server_name ocd-live.votredomaine.tld;
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
}
```

`certbot --nginx -d ocd-live.votredomaine.tld` pour le HTTPS (Let's Encrypt).
Sauvegarde de la base : c'est un simple fichier — `sqlite3 prisma/dev.db ".backup '/var/backups/ocd-$(date +%F).db'"` en cron.

### Netlify

Identique à Vercel (framework Next.js détecté) : **même obligation PostgreSQL**
(système de fichiers en lecture seule) → suivez le § 2 avec Neon, puis importez le
dépôt sur Netlify avec la variable `DATABASE_URL`.

---

## 4. Notes d'exploitation

- **Une seule variable d'environnement** : `DATABASE_URL`. Rien d'autre à régler.
- **Recharger la démo** : espace régie → bouton « recharger les données de démo »
  (appel `POST /api/demo`, réservé à l'admin).
- **Vos propres données** : les images de démonstration sont hébergées sur un CDN
  externe. Pour un usage durable, remplacez ces URL dans `src/lib/ocd/seed.ts` par
  vos images, ou téléversez-les dans `public/`.
- **Numéro WhatsApp de la régie** : à ajuster dans `src/lib/ocd/constants.ts`
  (`WHATSAPP_NUMBER`) et dans `src/components/ocd/chrome.tsx` (bulle flottante + pied de page).
- **Coûts** : Vercel (hobby) + Neon (free) = 0 € pour un trafic de démonstration ;
  la limite Neon gratuite est largement suffisante pour des milliers de visites par mois.
