import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireVendor } from '@/lib/ocd/auth'
import { autoExpireLives, computeLiveStatus } from '@/lib/ocd/live-status'
import { getActiveSubscription } from '@/lib/ocd/live-status'
import {
  CATEGORIES,
  COUNTRIES,
  LIVE_PLATFORM_MAP,
  MAX_PENDING_LIVES,
  SLOT_MAP,
  SUBMIT_COOLDOWN_MIN,
} from '@/lib/ocd/constants'

// ---- GET public : lives validés (en direct / à venir aujourd'hui) ----
export async function GET(req: NextRequest) {
  try {
    await autoExpireLives()
    const sp = req.nextUrl.searchParams
    const country = sp.get('country')
    const category = sp.get('category')
    const slot = sp.get('slot')
    const q = sp.get('q')?.trim()

    const where: Record<string, unknown> = { status: 'VALIDATED' }
    if (country && COUNTRIES.some((c) => c.code === country)) where.country = country
    if (category && CATEGORIES.some((c) => c.id === category)) where.category = category
    if (slot && SLOT_MAP[slot]) where.slot = slot
    // Recherche côté serveur : nom du vendeur, boutique, ville (utile en dehors du navigateur)
    if (q) {
      where.OR = [
        { displayName: { contains: q } },
        { shop: { name: { contains: q } } },
        { shop: { city: { contains: q } } },
      ]
    }

    const lives = await db.liveSubmission.findMany({
      where,
      include: { shop: true },
      orderBy: [{ isDemo: 'desc' }, { createdAt: 'desc' }],
    })

    const computed = lives
      .map((l) => computeLiveStatus(l))
      // En direct, à venir aujourd'hui, et sessions programmées (datées futures, ex : 15 novembre)
      .filter((c) => c.status === 'LIVE' || c.status === 'UPCOMING_TODAY' || c.status === 'UPCOMING')
      .map((c) => ({
        id: c.live.id,
        displayName: c.live.displayName,
        photoUrl: c.live.photoUrl,
        country: c.live.country,
        category: c.live.category,
        slot: c.live.slot,
        mode: c.live.mode,
        platform: c.live.platform,
        liveUrl: c.live.liveUrl,
        isDemo: c.live.isDemo,
        status: c.status,
        startsAtLabel: c.startsAtLabel,
        endsAtLabel: c.endsAtLabel,
        shop: c.live.shop
          ? {
              id: c.live.shop.id,
              name: c.live.shop.name,
              slug: c.live.shop.slug,
              logoUrl: c.live.shop.logoUrl,
              city: c.live.shop.city,
            }
          : null,
      }))

    return NextResponse.json({ lives: computed })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// ---- POST : soumission d'un live par un vendeur ----
const submitSchema = z.object({
  displayName: z.string().trim().min(2, 'Indiquez votre nom ou celui de votre commerce').max(60),
  country: z.string().refine((v) => COUNTRIES.some((c) => c.code === v), 'Choisissez votre pays'),
  category: z.string().refine((v) => CATEGORIES.some((c) => c.id === v), 'Choisissez une catégorie'),
  slot: z.enum(['MATIN', 'SOIR']),
  mode: z.enum(['presentiel', 'distance']),
  platform: z.string().default('tiktok'),
  liveUrl: z.string().trim().optional().or(z.literal('')),
  scheduledDate: z.string().optional().or(z.literal('')), // ISO date (yyyy-mm-dd), optionnel
  shopId: z.string().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const vendor = await requireVendor()
    if (!vendor) {
      return NextResponse.json(
        { error: 'Connectez-vous avec un compte vendeur pour soumettre un live.' },
        { status: 401 },
      )
    }

    // L'abonnement doit être actif pour soumettre (service payant)
    const sub = await getActiveSubscription(vendor.id)
    if (!sub) {
      return NextResponse.json(
        { error: 'ABONNEMENT_REQUIS', message: 'Un abonnement actif (5 000 FCFA/mois) est nécessaire pour soumettre un live.' },
        { status: 402 },
      )
    }

    const parsed = submitSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      )
    }
    const data = parsed.data

    // Le lien est obligatoire en mode à distance ; en présentiel, la régie diffuse sur le compte OCD
    if (data.mode === 'distance') {
      if (!data.liveUrl || !/^https?:\/\//i.test(data.liveUrl)) {
        return NextResponse.json({ error: 'Ajoutez le lien http(s) de votre live.' }, { status: 400 })
      }
      let host: string
      try {
        host = new URL(data.liveUrl).hostname.toLowerCase()
      } catch {
        return NextResponse.json({ error: 'Lien invalide.' }, { status: 400 })
      }
      const platform = LIVE_PLATFORM_MAP[data.platform]
      const known = platform?.hosts.some((h) => host === h || host.endsWith('.' + h))
      if (!known) {
        return NextResponse.json(
          { error: `Ce lien ne correspond pas à ${platform?.label ?? 'la plateforme choisie'}. Vérifiez le lien de votre live.` },
          { status: 400 },
        )
      }
    }

    // Anti-abus : lives en attente, cooldown, doublons de lien
    const pendingCount = await db.liveSubmission.count({
      where: { vendorId: vendor.id, status: 'PENDING' },
    })
    if (pendingCount >= MAX_PENDING_LIVES) {
      return NextResponse.json(
        { error: `Vous avez déjà ${MAX_PENDING_LIVES} lives en attente de validation. Attendez la réponse de la régie.` },
        { status: 429 },
      )
    }
    const last = await db.liveSubmission.findFirst({
      where: { vendorId: vendor.id },
      orderBy: { createdAt: 'desc' },
    })
    if (
      last &&
      Date.now() - last.createdAt.getTime() < SUBMIT_COOLDOWN_MIN * 60 * 1000 &&
      last.status === 'PENDING'
    ) {
      const min = Math.ceil((SUBMIT_COOLDOWN_MIN * 60 * 1000 - (Date.now() - last.createdAt.getTime())) / 60000)
      return NextResponse.json(
        { error: `Attendez ${min} min avant une nouvelle soumission (protection anti-spam).` },
        { status: 429 },
      )
    }
    if (data.liveUrl) {
      const duplicate = await db.liveSubmission.findFirst({
        where: { vendorId: vendor.id, liveUrl: data.liveUrl, createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Ce lien a déjà été soumis ces dernières 24 h.' },
          { status: 429 },
        )
      }
    }

    // Boutique associée (facultative) : elle doit appartenir au vendeur
    let shopId: string | null = null
    if (data.shopId) {
      const shop = await db.shop.findUnique({ where: { id: data.shopId } })
      if (shop && shop.ownerId === vendor.id) shopId = shop.id
    }

    // Date prévue : aujourd'hui ou demain selon le créneau (en heure du pays)
    let scheduledDate: Date | null = null
    if (data.scheduledDate) {
      const d = new Date(data.scheduledDate + 'T12:00:00Z')
      if (!isNaN(d.getTime())) scheduledDate = d
    }

    const live = await db.liveSubmission.create({
      data: {
        vendorId: vendor.id,
        shopId,
        displayName: data.displayName,
        country: data.country,
        category: data.category,
        slot: data.slot,
        mode: data.mode,
        platform: data.mode === 'presentiel' ? 'ocd' : data.platform,
        liveUrl: data.mode === 'presentiel' ? null : data.liveUrl,
        scheduledDate,
        status: 'PENDING',
        photoUrl: vendor.avatarUrl,
      },
    })
    return NextResponse.json({ live: { id: live.id, status: live.status } }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur, réessayez.' }, { status: 500 })
  }
}
