// Constantes OCD — pays, catégories, créneaux, opérateurs Mobile Money
export interface CountryInfo {
  code: string
  name: string
  flag: string // identifiant de drapeau (rendu SVG côté client)
  tz: string // fuseau IANA (affichage)
  utc: number // décalage UTC fixe (Afrique de l'Ouest/Centrale : pas d'heure d'été)
  currency: string // code devise d'affichage des prix boutique
  currencyLabel: string
  momo: string[] // opérateurs Mobile Money réellement disponibles
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'BJ', name: 'Bénin', flag: 'BJ', tz: 'Africa/Porto-Novo', utc: 1, currency: 'XOF', currencyLabel: 'FCFA', momo: ['MTN MoMo', 'Moov Money'] },
  { code: 'TG', name: 'Togo', flag: 'TG', tz: 'Africa/Lome', utc: 0, currency: 'XOF', currencyLabel: 'FCFA', momo: ['T-Money', 'Flooz'] },
  { code: 'CM', name: 'Cameroun', flag: 'CM', tz: 'Africa/Douala', utc: 1, currency: 'XOF', currencyLabel: 'FCFA', momo: ['MTN MoMo', 'Orange Money'] },
  { code: 'CI', name: "Côte d'Ivoire", flag: 'CI', tz: 'Africa/Abidjan', utc: 0, currency: 'XOF', currencyLabel: 'FCFA', momo: ['Orange Money', 'MTN MoMo', 'Wave', 'Moov Money'] },
  { code: 'NG', name: 'Nigeria', flag: 'NG', tz: 'Africa/Lagos', utc: 1, currency: 'NGN', currencyLabel: '₦', momo: ['Carte bancaire', 'OPay'] },
  { code: 'GH', name: 'Ghana', flag: 'GH', tz: 'Africa/Accra', utc: 0, currency: 'GHS', currencyLabel: 'GH₵', momo: ['MTN MoMo', 'Telecel Cash', 'AirtelTigo Money'] },
  { code: 'SN', name: 'Sénégal', flag: 'SN', tz: 'Africa/Dakar', utc: 0, currency: 'XOF', currencyLabel: 'FCFA', momo: ['Orange Money', 'Wave', 'Free Money'] },
  { code: 'BF', name: 'Burkina Faso', flag: 'BF', tz: 'Africa/Ouagadougou', utc: 0, currency: 'XOF', currencyLabel: 'FCFA', momo: ['Orange Money', 'Moov Money'] },
  { code: 'ML', name: 'Mali', flag: 'ML', tz: 'Africa/Bamako', utc: 0, currency: 'XOF', currencyLabel: 'FCFA', momo: ['Orange Money', 'Moov Money'] },
  { code: 'GN', name: 'Guinée', flag: 'GN', tz: 'Africa/Conakry', utc: 0, currency: 'GNF', currencyLabel: 'GNF', momo: ['Orange Money', 'MTN MoMo'] },
  { code: 'CD', name: 'RD Congo', flag: 'CD', tz: 'Africa/Kinshasa', utc: 1, currency: 'CDF', currencyLabel: 'FC', momo: ['M-Pesa', 'Orange Money', 'Airtel Money'] },
]

export const COUNTRY_MAP: Record<string, CountryInfo> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c]),
)

export interface CategoryInfo {
  id: string
  label: string
  icon: string // identifiant d'icône (rendu côté client)
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'nourriture', label: 'Nourriture & restauration', icon: 'utensils' },
  { id: 'vetements', label: 'Vêtements & mode', icon: 'shirt' },
  { id: 'chaussures', label: 'Chaussures & accessoires', icon: 'footprints' },
  { id: 'beaute', label: 'Beauté & cosmétiques', icon: 'sparkles' },
  { id: 'electronique', label: 'Téléphones & électronique', icon: 'smartphone' },
  { id: 'alimentaire', label: 'Produits alimentaires', icon: 'package' },
  { id: 'services', label: 'Services', icon: 'briefcase' },
  { id: 'autres', label: 'Autres commerces', icon: 'store' },
]

export const CATEGORY_MAP: Record<string, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

// Créneaux commerciaux quotidiens — OCD Live
export interface SlotInfo {
  id: 'MATIN' | 'SOIR'
  label: string
  startH: number
  endH: number
}

export const SLOTS: SlotInfo[] = [
  { id: 'MATIN', label: 'Créneau du matin', startH: 8, endH: 11 },
  { id: 'SOIR', label: 'Créneau du soir', startH: 18, endH: 21 },
]

export const SLOT_MAP: Record<string, SlotInfo> = Object.fromEntries(
  SLOTS.map((s) => [s.id, s]),
)

// Abonnement OCD Live
export const SUBSCRIPTION_PRICE = 5000 // FCFA / mois
export const SUBSCRIPTION_CURRENCY = 'XOF'
export const SUBSCRIPTION_DAYS = 30

// Plateformes de live acceptées (validation du lien)
export const LIVE_PLATFORMS: { id: string; label: string; hosts: string[]; urlHint: string }[] = [
  {
    id: 'tiktok',
    label: 'TikTok',
    hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    urlHint: 'https://www.tiktok.com/@votrenom/live',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    hosts: ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
    urlHint: 'https://www.youtube.com/watch?v=...',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    hosts: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch', 'web.facebook.com'],
    urlHint: 'https://www.facebook.com/votrepage/live',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    hosts: ['instagram.com', 'www.instagram.com'],
    urlHint: 'https://www.instagram.com/votrecompte',
  },
]

export const LIVE_PLATFORM_MAP: Record<string, (typeof LIVE_PLATFORMS)[number]> = Object.fromEntries(
  LIVE_PLATFORMS.map((p) => [p.id, p]),
)

// Limites anti-abus
export const MAX_PENDING_LIVES = 2 // max lives en attente par vendeur
export const SUBMIT_COOLDOWN_MIN = 10 // minutes entre deux soumissions
export const MAX_ACTIVE_LIVES_PER_VENDOR = 1 // max lives validés actifs simultanés

// Équipes de validation OCD
export const REGIE_NAME = 'Régie OCD Bovann'
export const WHATSAPP_NUMBER = '22890000000' // à remplacer par le numéro réel de la régie
