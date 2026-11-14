import { db } from '@/lib/db'
import { COUNTRY_MAP, SLOT_MAP } from '@/lib/ocd/constants'
import type { LiveSubmission, Shop } from '@prisma/client'

export interface LiveWithShop extends LiveSubmission {
  shop: Shop | null
}

// Heure courante dans un pays — décalage UTC fixe (Afrique de l'Ouest/Centrale :
// aucun passage à l'heure d'été). Plus fiable que Intl dans tous les runtime.
export function nowInTz(tz: string): { hour: number; minute: number; dateKey: string } {
  const off = TZ_OFFSETS[tz] ?? 0
  const shifted = new Date(Date.now() + off * 3600 * 1000)
  return {
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    dateKey: shifted.toISOString().slice(0, 10),
  }
}

const TZ_OFFSETS: Record<string, number> = Object.fromEntries(
  Object.values(COUNTRY_MAP).map((c) => [c.tz, c.utc]),
)

// Date locale (yyyy-mm-dd) d'une date prévue, dans le pays
function dateKeyInTz(d: Date, tz: string): string {
  const off = TZ_OFFSETS[tz] ?? 0
  return new Date(d.getTime() + off * 3600 * 1000).toISOString().slice(0, 10)
}

export type LiveStatus = 'LIVE' | 'UPCOMING_TODAY' | 'UPCOMING' | 'ENDED'

export interface LiveComputed {
  live: LiveWithShop
  status: LiveStatus
  startsAtLabel: string // ex : "Aujourd'hui à 18h00" / "Demain à 08h00"
  endsAtLabel: string
}

export function computeLiveStatus(live: LiveWithShop): LiveComputed {
  const country = COUNTRY_MAP[live.country]
  const tz = country?.tz ?? 'Africa/Lome'
  const slot = SLOT_MAP[live.slot] ?? SLOT_MAP.MATIN
  const now = nowInTz(tz)
  const nowMin = now.hour * 60 + now.minute
  const startMin = slot.startH * 60
  const endMin = slot.endH * 60

  // Fenêtre du créneau aujourd'hui / déjà passée aujourd'hui
  const slotToday = nowMin >= startMin && nowMin < endMin
  const slotPast = nowMin >= endMin
  const hh = (h: number) => `${String(h).padStart(2, '0')}h00`

  // 1) Live daté (soumission réelle) : la date prévue décide, AVANT la fenêtre du jour.
  //    Sinon un live prévu dans trois semaines apparaîtrait « en direct » pendant
  //    le créneau du matin — seule la récurrence quotidienne de démo est concernée.
  if (live.scheduledDate) {
    const schedDateKey = dateKeyInTz(live.scheduledDate, tz)
    if (schedDateKey === now.dateKey) {
      if (slotPast) return { live, status: 'ENDED', startsAtLabel: '', endsAtLabel: '' }
      if (slotToday) {
        return {
          live,
          status: 'LIVE',
          startsAtLabel: `Depuis ${hh(slot.startH)}`,
          endsAtLabel: `Jusqu'à ${hh(slot.endH)}`,
        }
      }
      return {
        live,
        status: 'UPCOMING_TODAY',
        startsAtLabel: `Aujourd'hui à ${hh(slot.startH)}`,
        endsAtLabel: `Jusqu'à ${hh(slot.endH)}`,
      }
    }
    if (schedDateKey < now.dateKey) {
      // Date prévue révolue : la fiche expire et disparaît des lives actifs.
      return { live, status: 'ENDED', startsAtLabel: '', endsAtLabel: '' }
    }
    const label = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
    }).format(live.scheduledDate)
    return { live, status: 'UPCOMING', startsAtLabel: `${label} à ${hh(slot.startH)}`, endsAtLabel: `Jusqu'à ${hh(slot.endH)}` }
  }

  // 2) Lives récurrents quotidiens (données de démonstration) : fenêtre du jour
  if (slotToday) {
    return {
      live,
      status: 'LIVE',
      startsAtLabel: `Depuis ${hh(slot.startH)}`,
      endsAtLabel: `Jusqu'à ${hh(slot.endH)}`,
    }
  }

  // Prochaine session (aujourd'hui ou demain)
  if (slotPast) {
    return {
      live,
      status: 'UPCOMING',
      startsAtLabel: `Demain à ${hh(slot.startH)}`,
      endsAtLabel: `Jusqu'à ${hh(slot.endH)}`,
    }
  }
  return {
    live,
    status: 'UPCOMING_TODAY',
    startsAtLabel: `Aujourd'hui à ${hh(slot.startH)}`,
    endsAtLabel: `Jusqu'à ${hh(slot.endH)}`,
  }
}

// Nettoie automatiquement : les lives validés dont le créneau est passé
// (datés passés) passent en ENDED et disparaissent des lives actifs.
export async function autoExpireLives(): Promise<number> {
  const validated = await db.liveSubmission.findMany({
    where: { status: 'VALIDATED', scheduledDate: { not: null } },
    include: { shop: true },
  })
  let expired = 0
  for (const live of validated) {
    const computed = computeLiveStatus(live as LiveWithShop)
    if (computed.status === 'ENDED') {
      await db.liveSubmission.update({ where: { id: live.id }, data: { status: 'ENDED' } })
      expired++
    }
  }
  return expired
}

// Statut d'abonnement d'un vendeur
export function subscriptionActive(sub: { endDate: Date; status: string } | null): boolean {
  if (!sub) return false
  if (sub.status !== 'ACTIVE' && sub.status !== 'EXPIRING') return false
  return sub.endDate.getTime() > Date.now()
}

export async function getActiveSubscription(vendorId: string) {
  const subs = await db.subscription.findMany({
    where: { vendorId },
    orderBy: { endDate: 'desc' },
  })
  return subs.find((s) => subscriptionActive(s)) ?? null
}
