// Données de démonstration OCD — clairement identifiées (isDemo = true).
// Ces données alimentent la plateforme pour la tester : chaque fiche porte le badge « DÉMO ».
// Le compte régie (régie@ocd.live / OCD2026) est le compte administrateur de la régie OCD Bovann.
//
// Images : chaque produit a ses propres images, vérifiées visuellement (une image = un produit,
// aucune image partagée entre deux fiches, aucun doublon dans une galerie).
// Lives : récurrences quotidiennes actives + calendrier daté du 8 au 15 novembre 2026
// (historique terminé, sessions du jour, sessions à venir).
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/ocd/auth'

const A = {
  // Avatars vendeurs / vendeuses — portraits sans filigrane, un avatar unique par vendeur
  av1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b33c4d037a1c.jpeg',
  av2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c5cfe1334ab3.jpg',
  av3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c5c87eda8131.jpg',
  av4: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d70957fc36e1.jpg',
  av5: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/36048e87b291.png',
  av6: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c1f3c0557759.jpg',
  av7: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/266b04ec477f.jpg',
  av8: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/74816f874264.jpg',
  av9: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7687b8a3bcff.jpg',
  av10: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b5920d0bfc20.jpg',
  av11: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ae3b44dd65ee.jpg',
  av12: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/29656172c7aa.jpeg',
  av13: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f83634073859.jpeg',
  // Bannières
  bn1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5bb3f59b15b3.jpg',
  bn2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ab860cf7f1d8.jpg',
  bn3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/deb90b9e78ba.jpg',
  bn4: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2f2ec8efefd7.jpg',
  // Nourriture — plats braisés et fritures
  f1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a295bbfcb477.jpg',
  f2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/82479276bc83.jpg',
  f3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c8867a4a9d6f.jpg',
  f5: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/02a67fec2b42.jpg',
  f9: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f280df32daea.jpg',
  f10: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7b518a2c6102.jpg',
  // Nourriture — jus de bissap et beignets
  jus1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/15efb28b3c4c.png',
  jus2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/dbde7a5824e7.jpg',
  beignet1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/241418dc218f.jpg',
  beignet2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a645f8290028.jpg',
  // Nourriture — igname frite, riz gras, poulet braisé
  igname1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/cd2836671f1f.jpg',
  igname2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b63a18cfa7fc.jpg',
  rizgras1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c95d0be051e5.jpg',
  rizgras2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f1d72693b4e1.jpg',
  rizgras3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c47a8bba733f.webp',
  poulet1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b343c0bae3ba.jpeg',
  poulet2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e2aec7349ccf.jpg',
  // Vêtements — modèles portés
  v1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ef1978be11af.jpg',
  v2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f68ef1aeb1ea.jpg',
  v3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7c08ee5f9f26.jpg',
  v4: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/dea728fd265d.jpg',
  v5: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/da23a82028be.png',
  v6: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4da4acfd13fa.jpeg',
  // Vêtements — pagnes / tissus wax pliés
  pagne1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f696fb8cdb1c.jpg',
  pagne2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9459c657504f.jpg',
  pagne3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a96c04dadf46.jpg',
  pagne4: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3a3164345d4e.jpg',
  pagne5: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/64804be25492.jpg',
  // Vêtements — boubous et ensembles wax femme
  boubou1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/464be8f21583.jpg',
  boubou2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9f5c1fe793f7.png',
  waxfemme1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8b030b9c8ec1.jpg',
  waxfemme2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/44d1a34383b6.jpg',
  waxfemme3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/627f5fc7f624.jpg',
  // Beauté — karité et savons
  b1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c4e20f76ff9.jpg',
  b2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3c615862f07d.jpg',
  b3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/bf32e9c0bd6e.jpg',
  b4: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/35167dc3d54a.jpg',
  b5: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c197d1388df2.jpg',
  b6: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8aee9d3d5360.png',
  // Beauté — huile de coco, tresses, soins visage
  b7: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/283f9d5ed21c.jpg',
  b8: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/053966592227.jpg',
  huilecoco1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/10bfc4679993.jpg',
  huilecoco2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a38c0623317b.jpg',
  soinvisage1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d4c2d470d7e6.jpg',
  soinvisage2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ded00784cfb7.jpg',
  // Chaussures — sandales et mocassins
  c1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/de401110d6c7.jpg',
  c2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a183cf5ddede.jpg',
  c3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c3570d355ba5.jpg',
  mocassin1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/b5398b5ded37.jpg',
  mocassin2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/83f303adb4a9.webp',
  mocassin3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/28e1b8dc39e2.jpg',
  // Électronique — smartphones, écouteurs, chargeur
  e1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/322a9c73eba6.png',
  e2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5a38b49381f3.jpg',
  e4: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/99a92181997a.jpg',
  ecouteurs1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/9171db9df8f0.jpg',
  ecouteurs2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e70f23687b81.jpg',
  ecouteurs3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/114154b5c6df.jpeg',
  chargeur1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0c568e33ad43.jpg',
  chargeur2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5e57bc5a5caa.jpg',
  // Alimentaire — épices, céréales, miel
  al1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c4c801904989.jpg',
  al3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1dac2734e00b.jpg',
  piment1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/511553ee5746.jpg',
  piment2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6eb039ab80a5.jpg',
  soumbala1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d1e281909301.jpg',
  epices1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a3f29d4126bc.jpg',
  epices2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/480771091d12.jpg',
  fonio1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e0ccb23a5de8.jpg',
  fonio2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/63c69f8cee20.png',
  miel1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ef01a79ff068.jpg',
  miel2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a5ceab61ca24.jpg',
  // Services — coiffure et tresses
  s1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/243e4c6f30c3.jpg',
  s2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/854d458a2fc0.jpg',
  s3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/78701ef0827d.jpg',
  tresses1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/186841b366e5.jpg',
  tresses2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3f55f5eb3b05.jpg',
  // Bijoux / artisanat
  j1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5b1aafd71467.jpg',
  j2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e324664947e8.jpg',
  j3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/adcb7fe3eb24.webp',
  panier1: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/e04aec2f17b8.jpg',
  panier2: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/abed29a01071.png',
  panier3: 'https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/782b0e93cfd4.jpg',
}

interface SeedVendor {
  email: string
  name: string
  country: string
  city: string
  avatar: string
  shopName: string
  shopCategory: string
  shopDesc: string
  banner: string
  momo: string
  products: { name: string; desc: string; price: number; currency: string; category: string; images: string[]; featured?: boolean }[]
}

const VENDORS: SeedVendor[] = [
  {
    email: 'awa@demo.ocd', name: 'Awa Kodjo', country: 'BJ', city: 'Cotonou', avatar: A.av1,
    shopName: 'Chez Maman Awa', shopCategory: 'nourriture',
    shopDesc: 'La cuisine béninoise de maman Awa : plats faits maison chaque matin, livrés chauds à Cotonou. Commandez avant 10h pour le déjeuner !',
    banner: A.bn1, momo: 'MTN MoMo',
    products: [
      { name: 'Attiéké poulet braisé', desc: 'Attiéké frais, poulet braisé, sauce tomate pimentée. Portion généreuse.', price: 2500, currency: 'XOF', category: 'nourriture', images: [A.f1, A.f2, A.f3], featured: true },
      { name: 'Assiette igname frite + sauce', desc: 'Igname frite croustillante, sauce arachide ou tomate.', price: 1500, currency: 'XOF', category: 'nourriture', images: [A.igname1, A.igname2, A.f5] },
      { name: 'Jus de bissap maison 1L', desc: 'Bissap frais, gingembre, menthe — préparé le matin même.', price: 1000, currency: 'XOF', category: 'alimentaire', images: [A.jus1, A.jus2] },
      { name: 'Beignets mille-feuilles (sachet)', desc: 'Beignets dorés, par sachet de 10.', price: 500, currency: 'XOF', category: 'alimentaire', images: [A.beignet2, A.beignet1] },
    ],
  },
  {
    email: 'folly@demo.ocd', name: 'Folly Kossi', country: 'TG', city: 'Lomé', avatar: A.av2,
    shopName: 'Wax & Style Lomé', shopCategory: 'vetements',
    shopDesc: 'Robes en wax cousues main, chemises bogolan et pagnes sur mesure. Retouches gratuites à Lomé.',
    banner: A.bn2, momo: 'T-Money',
    products: [
      { name: 'Robe wax — modèle Adjovi', desc: 'Tissu wax premium, doublure coton, tailles S à XL.', price: 12000, currency: 'XOF', category: 'vetements', images: [A.v1, A.v2], featured: true },
      { name: 'Chemise bogolan homme', desc: 'Bogolan authentique du Mali, coupe moderne.', price: 15000, currency: 'XOF', category: 'vetements', images: [A.v5, A.v6] },
      { name: 'Ensemble pagne 6 yards', desc: 'Pagne haute qualité, couleurs garanties.', price: 9000, currency: 'XOF', category: 'vetements', images: [A.pagne1, A.pagne2, A.pagne3] },
    ],
  },
  {
    email: 'ruth@demo.ocd', name: 'Ngo Bell Ruth', country: 'CM', city: 'Douala', avatar: A.av3,
    shopName: 'Karité & Savons Douala', shopCategory: 'beaute',
    shopDesc: 'Beurre de karité pur, savons noirs et cosmétiques naturels du Cameroun. Livraison Douala et Yaoundé.',
    banner: A.bn3, momo: 'Orange Money',
    products: [
      { name: 'Beurre de karité brut 500g', desc: 'Karité non raffiné du Nord Cameroun, 100 % naturel.', price: 3000, currency: 'XOF', category: 'beaute', images: [A.b1, A.b2, A.b3], featured: true },
      { name: 'Savon noir africain (pain)', desc: 'Savon noir traditionnel, peaux sensibles.', price: 1500, currency: 'XOF', category: 'beaute', images: [A.b5, A.b6, A.b4] },
      { name: 'Huile de coco pressée à froid', desc: 'Cheveux, peau, cuisine — 250 ml.', price: 2500, currency: 'XOF', category: 'beaute', images: [A.huilecoco1, A.huilecoco2] },
    ],
  },
  {
    email: 'aicha@demo.ocd', name: 'Aïcha Traoré', country: 'CI', city: 'Abidjan', avatar: A.av4,
    shopName: 'Maquis Chez Aïcha', shopCategory: 'nourriture',
    shopDesc: 'Poulet braisé, alloco et plats ivoiriens à emporter. Ouvert du matin au soir à Abidjan Cocody.',
    banner: A.bn4, momo: 'Orange Money',
    products: [
      { name: 'Poulet braisé + attiéké', desc: 'Demi-poulet braisé, attiéké, alloco et sauce cléclé.', price: 4000, currency: 'XOF', category: 'nourriture', images: [A.poulet1, A.poulet2], featured: true },
      { name: 'Alloco (plantain frit) 1L', desc: 'Plantains mûrs frits, piment au choix.', price: 1500, currency: 'XOF', category: 'nourriture', images: [A.f10, A.f9] },
      { name: 'Riz gras maison', desc: 'Riz gras à la viande, portion unique.', price: 2000, currency: 'XOF', category: 'nourriture', images: [A.rizgras1, A.rizgras2, A.rizgras3] },
    ],
  },
  {
    email: 'chidi@demo.ocd', name: 'Chidi Okafor', country: 'NG', city: 'Lagos', avatar: A.av9,
    shopName: 'Okafor Phones', shopCategory: 'electronique',
    shopDesc: 'Smartphones et accessoires testés à Lagos. Garantie 3 mois sur chaque téléphone.',
    banner: A.bn1, momo: 'Carte bancaire',
    products: [
      { name: 'Smartphone 128 Go (dual SIM)', desc: 'Écran 6,6", 128 Go, double SIM, garantie 3 mois.', price: 250000, currency: 'NGN', category: 'electronique', images: [A.e1, A.e2, A.e4], featured: true },
      { name: 'Écouteurs Bluetooth', desc: 'Autonomie 20h, boîtier de charge.', price: 18000, currency: 'NGN', category: 'electronique', images: [A.ecouteurs1, A.ecouteurs2, A.ecouteurs3] },
      { name: 'Chargeur rapide 33W + câble', desc: 'Charge rapide USB-C, câble tressé.', price: 12000, currency: 'NGN', category: 'electronique', images: [A.chargeur1, A.chargeur2] },
    ],
  },
  {
    email: 'akosua@demo.ocd', name: 'Akosua Mensah', country: 'GH', city: 'Accra', avatar: A.av5,
    shopName: 'Accra Leather Sandals', shopCategory: 'chaussures',
    shopDesc: 'Sandales et mocassins en cuir cousus main à Accra Makola. Customisation sur demande.',
    banner: A.bn2, momo: 'MTN MoMo',
    products: [
      { name: 'Sandales cuir tressées', desc: 'Cuir véritable, semelle renforcée, tailles 36–45.', price: 180, currency: 'GHS', category: 'chaussures', images: [A.c1, A.c2, A.c3], featured: true },
      { name: 'Mocassins cuir homme', desc: 'Cuir souple, cousus main, noir ou marron.', price: 250, currency: 'GHS', category: 'chaussures', images: [A.mocassin1, A.mocassin2, A.mocassin3] },
    ],
  },
  {
    email: 'fatou@demo.ocd', name: 'Fatou Ndiaye', country: 'SN', city: 'Dakar', avatar: A.av6,
    shopName: 'Dakar Tresses & Beauty', shopCategory: 'beaute',
    shopDesc: 'Tresses, mèches et soins à domicile ou en salon à Dakar. Réservation par WhatsApp.',
    banner: A.bn3, momo: 'Wave',
    products: [
      { name: 'Tresses collées (pose complète)', desc: 'Pose à domicile, mèches comprises, 3–4 h.', price: 8000, currency: 'XOF', category: 'services', images: [A.b7, A.b8, A.s1], featured: true },
      { name: 'Soins visage karité', desc: 'Gommage + masque karité, 45 min.', price: 5000, currency: 'XOF', category: 'services', images: [A.soinvisage1, A.soinvisage2] },
    ],
  },
  {
    email: 'issouf@demo.ocd', name: 'Issouf Compaoré', country: 'BF', city: 'Ouagadougou', avatar: A.av10,
    shopName: 'Épices du Faso', shopCategory: 'alimentaire',
    shopDesc: 'Piments séchés, soumbala et mélanges d\'épices du Burkina Faso, conditionnés à Ouaga.',
    banner: A.bn4, momo: 'Orange Money',
    products: [
      { name: 'Piment rouge séché 250g', desc: 'Piment du Faso, séché au soleil.', price: 1200, currency: 'XOF', category: 'alimentaire', images: [A.piment1, A.piment2, A.al1], featured: true },
      { name: 'Soumbala (néré) 200g', desc: 'Condiment traditionnel pour sauces.', price: 1000, currency: 'XOF', category: 'alimentaire', images: [A.soumbala1, A.al3] },
      { name: 'Mélange épices grillades', desc: 'Mélange maison pour poulet et poisson braisés.', price: 1500, currency: 'XOF', category: 'alimentaire', images: [A.epices1, A.epices2] },
    ],
  },
  {
    email: 'mariam@demo.ocd', name: 'Mariam Diallo', country: 'ML', city: 'Bamako', avatar: A.av7,
    shopName: 'Bamako Céréales & Miel', shopCategory: 'alimentaire',
    shopDesc: 'Fonio, miel de gomme et céréales locales de Bamako. Produits de coopératives.',
    banner: A.bn1, momo: 'Orange Money',
    products: [
      { name: 'Fonio précuit 1kg', desc: 'Fonio du Mali, prêt en 5 min.', price: 1800, currency: 'XOF', category: 'alimentaire', images: [A.fonio1, A.fonio2], featured: true },
      { name: 'Miel de gomme 500ml', desc: 'Miel pur récolté au Sahel.', price: 3500, currency: 'XOF', category: 'alimentaire', images: [A.miel1, A.miel2] },
    ],
  },
  {
    email: 'koffi@demo.ocd', name: 'Koffi Adjovi', country: 'BJ', city: 'Porto-Novo', avatar: A.av11,
    shopName: 'Adjovi Mode', shopCategory: 'vetements',
    shopDesc: 'Boubous brodés et pagnes haute qualité à Porto-Novo. Sur mesure en 48 h.',
    banner: A.bn2, momo: 'Moov Money',
    products: [
      { name: 'Boubou grand brodé', desc: 'Broderie main, tissu bazin riche.', price: 25000, currency: 'XOF', category: 'vetements', images: [A.boubou1, A.boubou2], featured: true },
      { name: 'Pagne wax 6 yards premium', desc: 'Couleurs vives garanties au lavage.', price: 8000, currency: 'XOF', category: 'vetements', images: [A.v3, A.v4] },
    ],
  },
  {
    email: 'grace@demo.ocd', name: 'Grace Mwangi', country: 'CD', city: 'Kinshasa', avatar: A.av8,
    shopName: 'Kin Style Coiffure', shopCategory: 'services',
    shopDesc: 'Coiffure, tresses et soins à Kinshasa Gombe. Réservation par WhatsApp, déplacement possible.',
    banner: A.bn3, momo: 'M-Pesa',
    products: [
      { name: 'Tresses complete (2 jours)', desc: 'Pose complète, mèches comprises.', price: 25000, currency: 'CDF', category: 'services', images: [A.tresses1, A.tresses2], featured: true },
      { name: 'Coupe + soin enfant', desc: 'Coupe, lavage, soin hydratant.', price: 15000, currency: 'CDF', category: 'services', images: [A.s2, A.s3] },
    ],
  },
  {
    email: 'boubacar@demo.ocd', name: 'Boubacar Sy', country: 'TG', city: 'Kara', avatar: A.av12,
    shopName: 'Kara Artisanat', shopCategory: 'autres',
    shopDesc: 'Colliers en perles, paniers tressés et artisanat du Nord Togo. Pièces uniques.',
    banner: A.bn4, momo: 'Flooz',
    products: [
      { name: 'Collier perles Tuareg', desc: 'Pièce unique, perles et argent.', price: 7500, currency: 'XOF', category: 'autres', images: [A.j1, A.j2, A.j3], featured: true },
      { name: 'Panier tressé terre cuite', desc: 'Fibre naturelle, teinture ocre.', price: 4500, currency: 'XOF', category: 'autres', images: [A.panier1, A.panier2, A.panier3] },
    ],
  },
  {
    email: 'mariama@demo.ocd', name: 'Mariama Camara', country: 'GN', city: 'Conakry', avatar: A.av13,
    shopName: 'Conakry Wax & Pagnes', shopCategory: 'vetements',
    shopDesc: 'Pagnes et wax de Conakry — choix large, prix marchés de Madina.',
    banner: A.bn2, momo: 'Orange Money',
    products: [
      { name: 'Ensemble wax femme', desc: 'Haut + jupe en wax, tailles S à XL.', price: 11000, currency: 'XOF', category: 'vetements', images: [A.waxfemme1, A.waxfemme2, A.waxfemme3], featured: true },
      { name: 'Pagne guinéen 6 yards', desc: 'Couleurs traditionnelles guinéennes.', price: 8500, currency: 'XOF', category: 'vetements', images: [A.pagne4, A.pagne5] },
    ],
  },
]

// Lives récurrents quotidiens (démo) : aucune date fixe — actifs à chaque créneau.
interface SeedLive {
  vendorEmail: string
  slot: 'MATIN' | 'SOIR'
  mode: 'presentiel' | 'distance'
  status: 'VALIDATED' | 'PENDING' | 'REJECTED'
  handle: string
  reason?: string
}

const RECURRING_LIVES: SeedLive[] = [
  { vendorEmail: 'awa@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'chezmamanawa' },
  { vendorEmail: 'koffi@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'adjovimode' },
  { vendorEmail: 'aicha@demo.ocd', slot: 'SOIR', mode: 'presentiel', status: 'VALIDATED', handle: 'chezmamanawa' },
  { vendorEmail: 'awa@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'PENDING', handle: 'chezmamanawa2' },
  { vendorEmail: 'folly@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'waxstylelome' },
  { vendorEmail: 'folly@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'PENDING', handle: 'waxstylelome' },
  { vendorEmail: 'boubacar@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'karaartisanat' },
  { vendorEmail: 'boubacar@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'karaartisanat2' },
  { vendorEmail: 'ruth@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'karitedouala' },
  { vendorEmail: 'ruth@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'karitedouala2' },
  { vendorEmail: 'chidi@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'okaforphones' },
  { vendorEmail: 'akosua@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'accrasandals' },
  { vendorEmail: 'akosua@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'accrasandals2' },
  { vendorEmail: 'fatou@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'dakarbeauty' },
  { vendorEmail: 'issouf@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'epicesdufaso' },
  { vendorEmail: 'issouf@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'epicesdufaso2' },
  { vendorEmail: 'mariam@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'bamakocereales' },
  { vendorEmail: 'mariam@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'bamakocereales2' },
  { vendorEmail: 'grace@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'kinstylecoiffure' },
  { vendorEmail: 'mariama@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'conakrywax' },
  { vendorEmail: 'mariama@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'conakrywax2' },
  { vendorEmail: 'aicha@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'REJECTED', handle: 'maquichaicha', reason: 'Le lien ne montre aucune vente en cours — soumettez à nouveau quand vous êtes en direct.' },
]

// Lives datés (démo) : calendrier du 8 au 15 novembre 2026.
// day = jour de novembre 2026. Les sessions passées sont ENDED (historique),
// celles du 14 novembre sont du jour, celles du 15 novembre sont à venir.
interface SeedDatedLive {
  vendorEmail: string
  slot: 'MATIN' | 'SOIR'
  mode: 'presentiel' | 'distance'
  status: 'VALIDATED' | 'PENDING' | 'REJECTED' | 'ENDED'
  handle: string
  day: number
  reason?: string
  submittedDaysBefore?: number // créée X jours avant la session (défaut : 1)
}

const DATED_LIVES: SeedDatedLive[] = [
  // --- Historique du 8 au 13 novembre : sessions terminées ---
  { vendorEmail: 'awa@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'chezmamanawa', day: 8 },
  { vendorEmail: 'folly@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'ENDED', handle: 'waxstylelome', day: 8 },
  { vendorEmail: 'ruth@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'karitedouala', day: 9 },
  { vendorEmail: 'chidi@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'ENDED', handle: 'okaforphones', day: 9 },
  { vendorEmail: 'akosua@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'accrasandals', day: 10 },
  { vendorEmail: 'aicha@demo.ocd', slot: 'SOIR', mode: 'presentiel', status: 'ENDED', handle: 'chezaicha', day: 10 },
  { vendorEmail: 'issouf@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'epicesdufaso', day: 11 },
  { vendorEmail: 'mariam@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'ENDED', handle: 'bamakocereales', day: 11 },
  { vendorEmail: 'koffi@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'adjovimode', day: 12 },
  { vendorEmail: 'grace@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'ENDED', handle: 'kinstylecoiffure', day: 12 },
  { vendorEmail: 'mariama@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'REJECTED', handle: 'conakrywax3', day: 12, reason: 'La séquence de vente du 12 novembre n\'a pas été respectée (créneau dépassé). Soumettez à nouveau pour le créneau du soir.' },
  { vendorEmail: 'boubacar@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'karaartisanat', day: 13 },
  { vendorEmail: 'fatou@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'ENDED', handle: 'dakarbeauty', day: 13 },
  // --- Samedi 14 novembre (aujourd'hui) : sessions du jour ---
  { vendorEmail: 'awa@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'ENDED', handle: 'chezmamanawa', day: 14 },
  { vendorEmail: 'mariama@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'conakrywax', day: 14 },
  { vendorEmail: 'chidi@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'PENDING', handle: 'okaforphones2', day: 14 },
  // --- Dimanche 15 novembre : sessions à venir ---
  { vendorEmail: 'boubacar@demo.ocd', slot: 'MATIN', mode: 'distance', status: 'VALIDATED', handle: 'karaartisanat', day: 15 },
  { vendorEmail: 'aicha@demo.ocd', slot: 'MATIN', mode: 'presentiel', status: 'VALIDATED', handle: 'chezaicha', day: 15 },
  { vendorEmail: 'ruth@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'karitedouala', day: 15 },
  { vendorEmail: 'koffi@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'VALIDATED', handle: 'adjovimode', day: 15 },
  { vendorEmail: 'grace@demo.ocd', slot: 'SOIR', mode: 'distance', status: 'PENDING', handle: 'kinstylecoiffure2', day: 15 },
]

// 14 novembre 2026 (jour de référence du jeu de données)
const REF_DAY = new Date(2026, 10, 14, 12, 0, 0)
const novDate = (day: number) => new Date(2026, 10, day, 12, 0, 0)

export async function seedDemoData() {
  // Nettoyage idempotent : uniquement les données marquées démo
  const oldDemoUsers = await db.user.findMany({ where: { isDemo: true }, select: { id: true } })
  for (const u of oldDemoUsers) {
    await db.session.deleteMany({ where: { userId: u.id } })
    await db.order.deleteMany({ where: { shop: { ownerId: u.id } } })
    await db.payment.deleteMany({ where: { vendorId: u.id } })
    await db.subscription.deleteMany({ where: { vendorId: u.id } })
    await db.liveSubmission.deleteMany({ where: { vendorId: u.id } })
    await db.shop.deleteMany({ where: { ownerId: u.id } })
  }
  await db.user.deleteMany({ where: { isDemo: true } })
  await db.order.deleteMany({ where: { isDemo: true } })

  // Compte régie (administrateur) — recréé si absent
  const admin = await db.user.upsert({
    where: { email: 'regie@ocd.live' },
    update: {},
    create: {
      email: 'regie@ocd.live',
      name: 'Régie OCD Bovann',
      passwordHash: hashPassword('OCD2026'),
      role: 'ADMIN',
      country: 'TG',
      city: 'Lomé',
    },
  })

  // Vendeurs + boutiques + produits + abonnements + paiements
  const created: Record<string, { userId: string; shopId: string }> = {}
  let dayOffset = 26
  for (const v of VENDORS) {
    const user = await db.user.create({
      data: {
        email: v.email,
        name: v.name,
        passwordHash: hashPassword('demo1234'),
        role: 'VENDOR',
        country: v.country,
        city: v.city,
        phone: '+2299000000' + (VENDORS.indexOf(v) % 10),
        avatarUrl: v.avatar,
        isDemo: true,
      },
    })
    const slug = v.shopName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const shop = await db.shop.create({
      data: {
        ownerId: user.id,
        name: v.shopName,
        slug,
        description: v.shopDesc,
        category: v.shopCategory,
        country: v.country,
        city: v.city,
        logoUrl: v.avatar,
        bannerUrl: v.banner,
        whatsapp: '+2299000000' + (VENDORS.indexOf(v) % 10),
        phone: '+2299000000' + (VENDORS.indexOf(v) % 10),
        isDemo: true,
      },
    })
    created[v.email] = { userId: user.id, shopId: shop.id }
    for (const p of v.products) {
      await db.product.create({
        data: {
          shopId: shop.id,
          name: p.name,
          description: p.desc,
          price: p.price,
          currency: p.currency,
          category: p.category,
          images: JSON.stringify(p.images),
          isFeatured: !!p.featured,
          isDemo: true,
        },
      })
    }
    // Abonnement actif (démo) + historique de paiements
    const start = new Date(Date.now() - 4 * 86400000)
    const end = new Date(Date.now() + dayOffset * 86400000)
    dayOffset -= 2
    const sub = await db.subscription.create({
      data: {
        vendorId: user.id,
        startDate: start,
        endDate: end,
        amount: 5000,
        currency: 'XOF',
        status: 'ACTIVE',
        method: 'momo',
        provider: v.momo,
        isDemo: true,
      },
    })
    await db.payment.create({
      data: {
        vendorId: user.id,
        subscriptionId: sub.id,
        amount: 5000,
        currency: 'XOF',
        method: 'momo',
        provider: v.momo,
        reference: 'OCD-' + user.id.slice(-4).toUpperCase() + 'D' + Math.floor(Math.random() * 90 + 10),
        status: 'SUCCESS',
      },
    })
  }

  // Lives récurrents de démonstration (quotidiens)
  for (const l of RECURRING_LIVES) {
    const ids = created[l.vendorEmail]
    if (!ids) continue
    const vendor = VENDORS.find((v) => v.email === l.vendorEmail)!
    await db.liveSubmission.create({
      data: {
        vendorId: ids.userId,
        shopId: ids.shopId,
        displayName: vendor.shopName,
        country: vendor.country,
        category: vendor.shopCategory,
        slot: l.slot,
        mode: l.mode,
        platform: 'tiktok',
        liveUrl: l.mode === 'presentiel' ? null : `https://www.tiktok.com/@${l.handle}/live`,
        status: l.status,
        rejectionReason: l.reason ?? null,
        reviewedById: l.status === 'VALIDATED' ? admin.id : null,
        reviewedAt: l.status === 'VALIDATED' ? new Date(Date.now() - 2 * 3600000) : null,
        photoUrl: vendor.avatar,
        isDemo: true,
      },
    })
  }

  // Lives datés : calendrier du 8 au 15 novembre 2026
  for (const l of DATED_LIVES) {
    const ids = created[l.vendorEmail]
    if (!ids) continue
    const vendor = VENDORS.find((v) => v.email === l.vendorEmail)!
    const scheduled = novDate(l.day)
    const submitted = new Date(scheduled.getTime() - (l.submittedDaysBefore ?? 1) * 86400000 - 3 * 3600000)
    const reviewed =
      l.status === 'VALIDATED' || l.status === 'ENDED' || l.status === 'REJECTED'
        ? new Date(submitted.getTime() + 2 * 3600000)
        : null
    await db.liveSubmission.create({
      data: {
        vendorId: ids.userId,
        shopId: ids.shopId,
        displayName: vendor.shopName,
        country: vendor.country,
        category: vendor.shopCategory,
        slot: l.slot,
        mode: l.mode,
        platform: 'tiktok',
        liveUrl: l.mode === 'presentiel' ? null : `https://www.tiktok.com/@${l.handle}/live`,
        scheduledDate: scheduled,
        status: l.status,
        rejectionReason: l.reason ?? null,
        reviewedById: reviewed ? admin.id : null,
        reviewedAt: reviewed,
        createdAt: submitted,
        photoUrl: vendor.avatar,
        isDemo: true,
      },
    })
  }

  // Quelques commandes de démonstration
  const product = await db.product.findFirst({ where: { isDemo: true, isFeatured: true }, orderBy: { createdAt: 'asc' } })
  const product2 = await db.product.findFirst({ where: { isDemo: true, isFeatured: true }, orderBy: { createdAt: 'desc' } })
  if (product) {
    await db.order.create({
      data: {
        productId: product.id, shopId: product.shopId,
        buyerName: 'Clarisse A.', buyerPhone: '+22996123456', buyerCountry: 'BJ',
        quantity: 2, message: 'Livraison à Akpakpa avant midi svp', status: 'NEW', isDemo: true,
      },
    })
    await db.order.create({
      data: {
        productId: product.id, shopId: product.shopId,
        buyerName: 'Serge T.', buyerPhone: '+22890123456', buyerCountry: 'TG',
        quantity: 1, message: '', status: 'CONFIRMED', isDemo: true,
      },
    })
  }
  if (product2) {
    await db.order.create({
      data: {
        productId: product2.id, shopId: product2.shopId,
        buyerName: 'Emmanuella K.', buyerPhone: '+22507123456', buyerCountry: 'CI',
        quantity: 1, message: 'Couleur bleue si possible', status: 'NEW', isDemo: true,
      },
    })
  }

  return { ok: true, ref: REF_DAY.toISOString().slice(0, 10) }
}
