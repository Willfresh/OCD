import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, requireVendor } from '@/lib/ocd/auth'
import { computeLiveStatus } from '@/lib/ocd/live-status'
import { CATEGORIES, CATEGORY_MAP, COUNTRY_MAP } from '@/lib/ocd/constants'

// ---- GET public : produits (filtres) OU fiche complète d'un article (?id=) ----
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams

    // Fiche détail d'un article : TOUTES ses photos (jusqu'à 6) + infos boutique
    const detailId = sp.get('id')
    if (detailId) {
      const p = await db.product.findUnique({
        where: { id: detailId },
        include: { shop: { include: { owner: true } } },
      })
      if (!p || !p.isActive || !p.shop.isActive) {
        return NextResponse.json({ error: 'Article introuvable.' }, { status: 404 })
      }
      let images: string[] = []
      try {
        images = JSON.parse(p.images)
      } catch {}
      const validatedLives = await db.liveSubmission.findMany({
        where: { status: 'VALIDATED', vendorId: p.shop.ownerId },
        include: { shop: true },
      })
      let isLiveNow = false
      let liveSlot: string | null = null
      for (const l of validatedLives) {
        const c = computeLiveStatus(l)
        if (c.status === 'LIVE') {
          isLiveNow = true
          liveSlot = l.slot
        }
      }
      return NextResponse.json({
        product: {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          currency: p.currency,
          category: p.category,
          categoryLabel: CATEGORY_MAP[p.category]?.label ?? p.category,
          images: images.filter(Boolean).slice(0, 6),
          isFeatured: p.isFeatured,
          isDemo: p.isDemo,
          createdAt: p.createdAt,
          shop: {
            id: p.shop.id,
            name: p.shop.name,
            slug: p.shop.slug,
            description: p.shop.description,
            city: p.shop.city,
            country: p.shop.country,
            logoUrl: p.shop.logoUrl,
            bannerUrl: p.shop.bannerUrl,
            isDemo: p.shop.isDemo,
            isLiveNow,
            liveSlot,
            whatsapp: p.shop.whatsapp ?? p.shop.owner.phone,
          },
        },
      })
    }

    const country = sp.get('country')
    const category = sp.get('category')
    const shopId = sp.get('shopId')
    const q = sp.get('q')?.trim()
    // Tri : recommandé (vedettes d'abord), prix croissant/décroissant, nouveautés, nom
    const sort = sp.get('sort')

    const where: Record<string, unknown> = { isActive: true }
    // Le pays vit sur la boutique (le produit n'en a pas) : filtre relationnel
    if (country && COUNTRY_MAP[country]) where.shop = { country }
    if (category && CATEGORY_MAP[category]) where.category = category
    if (shopId) where.shopId = shopId
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { shop: { name: { contains: q } } },
        { shop: { city: { contains: q } } },
      ]
    }

    const SORT_MAP: Record<string, Record<string, unknown>[]> = {
      'price-asc': [{ price: 'asc' }, { createdAt: 'desc' }],
      'price-desc': [{ price: 'desc' }, { createdAt: 'desc' }],
      newest: [{ createdAt: 'desc' }],
      name: [{ name: 'asc' }],
    }
    const orderBy = SORT_MAP[sort ?? ''] ?? [{ isFeatured: 'desc' }, { isDemo: 'desc' }, { createdAt: 'desc' }]

    const products = await db.product.findMany({
      where,
      include: { shop: { include: { owner: true } } },
      orderBy,
      take: 60,
    })

    const validatedLives = await db.liveSubmission.findMany({
      where: { status: 'VALIDATED' },
      include: { shop: true },
    })
    const liveNowByVendor = new Map<string, string>()
    for (const l of validatedLives) {
      const c = computeLiveStatus(l)
      if (c.status === 'LIVE') liveNowByVendor.set(l.vendorId, l.slot)
    }

    return NextResponse.json({
      products: products.map((p) => {
        let images: string[] = []
        try {
          images = JSON.parse(p.images)
        } catch {}
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          currency: p.currency,
          category: p.category,
          categoryLabel: CATEGORY_MAP[p.category]?.label ?? p.category,
          images: images.slice(0, 3),
          isFeatured: p.isFeatured,
          isDemo: p.isDemo,
          shop: {
            id: p.shop.id,
            name: p.shop.name,
            slug: p.shop.slug,
            city: p.shop.city,
            country: p.shop.country,
            logoUrl: p.shop.logoUrl,
            isDemo: p.shop.isDemo,
            isLiveNow: liveNowByVendor.has(p.shop.ownerId),
            liveSlot: liveNowByVendor.get(p.shop.ownerId) ?? null,
            whatsapp: p.shop.whatsapp ?? p.shop.owner.phone,
          },
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

// ---- POST : ajouter un produit à ma boutique ----
const createSchema = z.object({
  name: z.string().trim().min(2, 'Nom du produit trop court').max(80),
  description: z.string().trim().max(400).optional().or(z.literal('')),
  price: z.number().int('Prix entier requis').min(100, 'Prix minimum : 100').max(100000000),
  currency: z.string().optional(),
  category: z.string().refine((v) => CATEGORIES.some((c) => c.id === v), 'Choisissez une catégorie'),
  images: z.array(z.string()).max(6).optional(),
})

export async function POST(req: NextRequest) {
  const vendor = await requireVendor()
  if (!vendor) return NextResponse.json({ error: 'Connectez-vous pour ajouter un produit.' }, { status: 401 })
  const shop = await db.shop.findUnique({ where: { ownerId: vendor.id } })
  if (!shop) {
    return NextResponse.json(
      { error: 'Créez d\'abord votre boutique avant d\'ajouter des produits.' },
      { status: 409 },
    )
  }
  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 },
    )
  }
  const d = parsed.data
  const product = await db.product.create({
    data: {
      shopId: shop.id,
      name: d.name,
      description: d.description || '',
      price: d.price,
      currency: shop.country && COUNTRY_MAP[shop.country]?.currency !== 'XOF'
        ? COUNTRY_MAP[shop.country].currency
        : 'XOF',
      category: d.category,
      images: JSON.stringify((d.images ?? []).filter(Boolean).slice(0, 6)),
    },
  })
  return NextResponse.json({ product: { id: product.id } }, { status: 201 })
}

// ---- PATCH / DELETE : gérer mes produits ----
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = await req.json()
  if (!body?.id) return NextResponse.json({ error: 'Produit manquant.' }, { status: 400 })
  const product = await db.product.findUnique({
    where: { id: body.id },
    include: { shop: true },
  })
  if (!product || product.shop.ownerId !== user.id) {
    return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  }
  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim().length >= 2) patch.name = body.name.trim()
  if (typeof body.description === 'string') patch.description = body.description.trim().slice(0, 400)
  if (typeof body.price === 'number' && body.price >= 100) patch.price = Math.round(body.price)
  if (typeof body.category === 'string' && CATEGORIES.some((c) => c.id === body.category)) patch.category = body.category
  if (Array.isArray(body.images)) patch.images = JSON.stringify(body.images.filter(Boolean).slice(0, 6))
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive
  if (typeof body.isFeatured === 'boolean') patch.isFeatured = body.isFeatured
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Rien à mettre à jour.' }, { status: 400 })
  await db.product.update({ where: { id: product.id }, data: patch })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Produit manquant.' }, { status: 400 })
  const product = await db.product.findUnique({ where: { id }, include: { shop: true } })
  if (!product || product.shop.ownerId !== user.id) {
    return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  }
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
