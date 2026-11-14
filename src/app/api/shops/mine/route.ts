import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireVendor } from '@/lib/ocd/auth'
import { computeLiveStatus } from '@/lib/ocd/live-status'

// Ma boutique + mes produits (tableau de bord vendeur)
export async function GET() {
  const vendor = await requireVendor()
  if (!vendor) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const shop = await db.shop.findUnique({
    where: { ownerId: vendor.id },
    include: { products: { orderBy: { createdAt: 'desc' } } },
  })
  const lives = await db.liveSubmission.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
    include: { shop: true },
  })
  const validatedLive = lives.find((l) => l.status === 'VALIDATED')
  const runtime = validatedLive ? computeLiveStatus(validatedLive) : null
  return NextResponse.json({
    shop: shop
      ? {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          description: shop.description,
          category: shop.category,
          country: shop.country,
          city: shop.city,
          logoUrl: shop.logoUrl,
          bannerUrl: shop.bannerUrl,
          whatsapp: shop.whatsapp,
          isActive: shop.isActive,
          isDemo: shop.isDemo,
          products: shop.products.map((p) => {
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
              images,
              isActive: p.isActive,
              isFeatured: p.isFeatured,
              isDemo: p.isDemo,
            }
          }),
        }
      : null,
    liveStatus: runtime ? { status: runtime.status, startsAtLabel: runtime.startsAtLabel } : null,
  })
}
