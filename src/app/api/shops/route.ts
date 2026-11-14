import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, requireVendor } from '@/lib/ocd/auth'
import { computeLiveStatus } from '@/lib/ocd/live-status'
import { CATEGORIES, COUNTRIES } from '@/lib/ocd/constants'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}

// ---- GET public : boutiques (filtres pays / catégorie / recherche) ----
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const country = sp.get('country')
    const category = sp.get('category')
    const q = sp.get('q')?.trim()

    const where: Record<string, unknown> = { isActive: true }
    if (country && COUNTRIES.some((c) => c.code === country)) where.country = country
    if (category && CATEGORIES.some((c) => c.id === category)) where.category = category
    if (q) where.name = { contains: q }

    const shops = await db.shop.findMany({
      where,
      include: { owner: true, products: { where: { isActive: true } } },
      orderBy: [{ isDemo: 'desc' }, { createdAt: 'desc' }],
    })

    // Lives en cours par vendeur (lien OCD Live ↔ OCD Shop)
    const validatedLives = await db.liveSubmission.findMany({
      where: { status: 'VALIDATED' },
      include: { shop: true },
    })
    const liveNowByVendor = new Map<string, { slot: string; endsAtLabel: string }>()
    for (const l of validatedLives) {
      const c = computeLiveStatus(l)
      if (c.status === 'LIVE') liveNowByVendor.set(l.vendorId, { slot: l.slot, endsAtLabel: c.endsAtLabel })
    }

    return NextResponse.json({
      shops: shops.map((s) => {
        const liveNow = liveNowByVendor.get(s.ownerId)
        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          category: s.category,
          country: s.country,
          city: s.city,
          logoUrl: s.logoUrl,
          bannerUrl: s.bannerUrl,
          whatsapp: s.whatsapp ?? s.owner.phone,
          productCount: s.products.length,
          priceRange: s.products.length
            ? {
                min: Math.min(...s.products.map((p) => p.price)),
                max: Math.max(...s.products.map((p) => p.price)),
                currency: s.products[0]?.currency ?? 'XOF',
              }
            : null,
          isDemo: s.isDemo,
          isLiveNow: !!liveNow,
          liveSlot: liveNow?.slot ?? null,
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// ---- POST : créer ma boutique (vendeur connecté) ----
const createSchema = z.object({
  name: z.string().trim().min(2, 'Nom de boutique trop court').max(60),
  description: z.string().trim().max(300).optional().or(z.literal('')),
  category: z.string().refine((v) => CATEGORIES.some((c) => c.id === v), 'Choisissez une catégorie'),
  country: z.string().refine((v) => COUNTRIES.some((c) => c.code === v), 'Choisissez votre pays'),
  city: z.string().trim().min(2, 'Indiquez votre ville').max(40),
  logoUrl: z.string().optional().or(z.literal('')),
  bannerUrl: z.string().optional().or(z.literal('')),
  whatsapp: z.string().trim().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const vendor = await requireVendor()
  if (!vendor) return NextResponse.json({ error: 'Connectez-vous pour créer votre boutique.' }, { status: 401 })
  const existing = await db.shop.findUnique({ where: { ownerId: vendor.id } })
  if (existing) {
    return NextResponse.json({ error: 'Vous avez déjà une boutique. Modifiez-la depuis votre espace.' }, { status: 409 })
  }
  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 },
    )
  }
  const d = parsed.data
  let slug = slugify(d.name)
  const clash = await db.shop.findUnique({ where: { slug } })
  if (clash) slug = slug + '-' + Date.now().toString(36).slice(-4)

  const shop = await db.shop.create({
    data: {
      ownerId: vendor.id,
      name: d.name,
      slug,
      description: d.description || '',
      category: d.category,
      country: d.country,
      city: d.city,
      logoUrl: d.logoUrl || vendor.avatarUrl,
      bannerUrl: d.bannerUrl || null,
      whatsapp: d.whatsapp || vendor.phone,
      phone: vendor.phone,
    },
  })
  return NextResponse.json({ shop: { id: shop.id, name: shop.name, slug: shop.slug } }, { status: 201 })
}

// ---- PATCH : modifier ma boutique ----
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const shop = await db.shop.findUnique({ where: { ownerId: user.id } })
  if (!shop) return NextResponse.json({ error: 'Aucune boutique à modifier.' }, { status: 404 })
  const body = await req.json()
  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim().length >= 2) patch.name = body.name.trim()
  if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 300)
  if (typeof body.category === 'string' && CATEGORIES.some((c) => c.id === body.category)) patch.category = body.category
  if (typeof body.country === 'string' && COUNTRIES.some((c) => c.code === body.country)) patch.country = body.country
  if (typeof body.city === 'string' && body.city.trim().length >= 2) patch.city = body.city.trim()
  if (typeof body.logoUrl === 'string' && body.logoUrl) patch.logoUrl = body.logoUrl
  if (typeof body.bannerUrl === 'string' && body.bannerUrl) patch.bannerUrl = body.bannerUrl
  if (typeof body.whatsapp === 'string') patch.whatsapp = body.whatsapp.trim()
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Rien à mettre à jour.' }, { status: 400 })
  }
  await db.shop.update({ where: { id: shop.id }, data: patch })
  return NextResponse.json({ ok: true })
}
