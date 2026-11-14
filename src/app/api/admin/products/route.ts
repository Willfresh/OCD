import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/ocd/auth'
import { CATEGORY_MAP } from '@/lib/ocd/constants'

// ---- GET : tous les produits de la marketplace (vue régie) ----
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  const products = await db.product.findMany({
    include: { shop: { select: { id: true, name: true, slug: true, country: true, city: true, isActive: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    products: products.map((p) => {
      let images: string[] = []
      try {
        images = JSON.parse(p.images)
      } catch {}
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
        category: p.category,
        categoryLabel: CATEGORY_MAP[p.category]?.label ?? p.category,
        images: images.filter(Boolean),
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isDemo: p.isDemo,
        createdAt: p.createdAt,
        shop: p.shop,
      }
    }),
  })
}

// ---- PATCH : masquer / réafficher / mettre en avant un produit ----
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  const body = await req.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'Produit manquant.' }, { status: 400 })
  const patch: Record<string, unknown> = {}
  if (typeof body.isActive === 'boolean') patch.isActive = body.isActive
  if (typeof body.isFeatured === 'boolean') patch.isFeatured = body.isFeatured
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Rien à mettre à jour.' }, { status: 400 })
  const product = await db.product.findUnique({ where: { id: body.id } })
  if (!product) return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  await db.product.update({ where: { id: product.id }, data: patch })
  return NextResponse.json({ ok: true })
}

// ---- DELETE : retirer un produit de la marketplace ----
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Produit manquant.' }, { status: 400 })
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Produit introuvable.' }, { status: 404 })
  await db.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
