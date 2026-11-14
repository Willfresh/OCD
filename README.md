# OCD Live & Shop — « L'Opportunité C'est Dehors »

Plateforme commerciale africaine ** imaginée par Bovann**, organisée par **House of Challenge** et **BOVANN GROUP** (Lomé, Togo), validée par la **régie OCD Bovann**.

Deux espaces complémentaires :

- **OCD Live** — les vendeurs diffusent en direct sur TikTok / YouTube / Facebook pendant les créneaux officiels (matin 08h–11h, soir 18h–21h, heure locale de chaque pays). Chaque fiche est validée par la régie avant publication.
- **OCD Shop** — la marketplace : boutiques vérifiées, catalogue produits multi-photos, commande en ligne (sans paiement) et contact direct WhatsApp avec le vendeur.

---

## Fonctionnalités

| Espace | Ce que l'on peut faire |
| --- | --- |
| Accueil | Présentation, pays couverts, statistiques en direct |
| OCD Live | **Recherche** (nom, boutique, ville, catégorie, plateforme — insensible aux accents), filtre par pays et catégorie, filtre « en direct uniquement », compteurs par créneau |
| OCD Shop | **Recherche** articles & boutiques, filtres pays + catégorie, **tri par prix croissant / décroissant**, nouveautés, nom, compteur de résultats, bouton de réinitialisation |
| Fiche boutique | Vitrine complète (logo, bannière, WhatsApp) + **tri des articles par prix** |
| Fiche article | Galerie multi-photos, badges, commander, contacter le vendeur, partage, articles « vus récemment » |
| Espace vendeur | Inscription, création de boutique, produits (CRUD), soumission de lives, suivi des commandes, abonnement 5 000 FCFA/mois |
| Espace régie (admin) | Validation / refus des lives, gestion boutiques, produits, utilisateurs, statistiques, rechargement des données de démo |
| Confort | Thème clair / sombre, navigation par hash (#/live, #/shop…) avec **filtres mémorisés dans l'URL** (liens partageables), design responsive mobile-first |

## Stack technique

- **Next.js 16** (App Router, une seule page, routage par hash) + **React 19**
- **Prisma ORM** + SQLite en local (bascule PostgreSQL en production — voir `DEPLOIEMENT.md`)
- **Tailwind CSS 4** + design system OCD maison (palette du logo : orange `#FA4900`, noir `#0A0908`, crème `#FFF9F1`)
- **Zod** pour la validation des API, **Zustand** pour l'état global
- Aucun paiement en ligne : les commandes partent au vendeur (WhatsApp) — paiement à la livraison / Mobile Money

## Structure

```
ocd-live-shop/
├── prisma/schema.prisma     # Modèles : User, Session, Shop, Product,
│                            # LiveSubmission, Subscription, Payment, Order
├── scripts/seed-demo.ts     # Données de démonstration (badges « DÉMO »)
├── src/
│   ├── app/                 # layout, page unique, globals.css
│   │   └── api/             # API REST : /lives, /products, /shops, /orders,
│   │                        # /auth/*, /admin/*, /stats, /subscription, /demo
│   ├── components/ocd/      # Vues (home, live, shop, vendor, admin…)
│   │                        # + store global (Zustand)
│   └── lib/                 # db (Prisma), auth, constantes, statut des lives, seed
└── public/                  # logo, images officielles
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm install` | Installe les dépendances **et génère le client Prisma** (postinstall) |
| `npm run dev` | Démarre le site en développement (http://localhost:3000) |
| `npm run build` | `prisma generate` + build production |
| `npm start` | Sert le build production |
| `npm run db:push` | Crée / met à jour la base (`prisma/dev.db`) — exige le fichier `.env` |
| `npm run db:seed` | Régénère le client puis insère les données de démo |
| `npm run lint` | Lint |

> Avec **Bun** : remplacez `npm` par `bun` (aucune différence de commande).

## Données de démonstration

- **Images produits** : chaque produit possède ses propres photos, vérifiées une à une (une image correspond au produit, aucune image partagée entre deux fiches, aucun doublon dans une galerie). Les avatars des 13 vendeurs et les bannières de boutique sont uniques et sans filigrane.
- **Lives** : 22 récurrences quotidiennes (actives à chaque créneau, matin 08h–11h / soir 18h–21h) **+ un calendrier daté du 8 au 15 novembre 2026** :
  - 8 → 13 novembre : sessions terminées (historique `ENDED`), 1 refus documenté ;
  - 14 novembre : sessions du jour (validée, en attente) ;
  - 15 novembre : 4 sessions validées (affichées « à venir » sur la page publique) + 1 en attente de la régie.
  La page publique OCD Live affiche désormais les sessions programmées (datées futures) en plus des sessions du jour.

## Comptes de démonstration (créés par `db:seed`)

| Rôle | Identifiant | Mot de passe |
| --- | --- | --- |
| Régie (admin) | `regie@ocd.live` | `OCD2026` |
| Vendeurs (×13) | `awa@demo.ocd`, `folly@demo.ocd`, … | `demo1234` |

Toutes les données de démo portent le badge **« DÉMO »** et peuvent être rechargées depuis l'espace régie.

## Déploiement

Consultez **`DEPLOIEMENT.md`** : mise en ligne sur **Vercel** (recommandé) en 10 minutes, plus alternatives (Railway, Render, VPS). Le guide couvre la bascule SQLite → PostgreSQL (Neon, option gratuite) nécessaire pour que les inscriptions et commandes fonctionnent en production.
