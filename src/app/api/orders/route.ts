import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/ocd/auth'
import { COUNTRIES } from '@/lib/ocd/constants'

// ---- POST public : passer une commande / contacter le vendeur ----
const schema = z.object({
  productId: z.string(),
  buyerName: z.string().trim().min(2, 'Votre nom est requis').max(60),
  buyerPhone: z.string().trim().min(8, 'Numéro de téléphone requis').max(20),
  buyerCountry: z.string().optional().or(z.literal('')),
  quantity: z.number().int().min(1).max(99).default(1),
  message: z.string().trim().max(300).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      )
    }
    const d = parsed.data
    const product = await db.product.findUnique({
      where: { id: d.productId },
      include: { shop: true },
    })
    if (!product || !product.isActive || !product.shop.isActive) {
      return NextResponse.json({ error: 'Produit indisponible.' }, { status: 404 })
    }
    if (d.buyerCountry && !COUNTRIES.some((c) => c.code === d.buyerCountry)) {
      return NextResponse.json({ error: 'Pays non reconnu.' }, { status: 400 })
    }
    const order = await db.order.create({
      data: {
        productId: d.productId,
        shopId: product.shopId,
        buyerName: d.buyerName,
        buyerPhone: d.buyerPhone,
        buyerCountry: d.buyerCountry || null,
        quantity: d.quantity,
        message: d.message || null,
      },
    })
    return NextResponse.json(
      { order: { id: order.id, createdAt: order.createdAt }, shopWhatsapp: product.shop.whatsapp ?? product.shop.phone },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ error: 'Erreur serveur, réessayez.' }, { status: 500 })
  }
}

// ---- GET : commandes reçues (vendeur) ou toutes (régie) ----
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const orders =
    user.role === 'ADMIN'
      ? await db.order.findMany({ include: { product: true, shop: true }, orderBy: { createdAt: 'desc' } })
      : await db.order.findMany({
          where: { shop: { ownerId: user.id } },
          include: { product: true, shop: true },
          orderBy: { createdAt: 'desc' },
        })
  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      product: { name: o.product?.name ?? 'Produit supprimé', price: o.product?.price, currency: o.product?.currency },
      shop: { name: o.shop.name, city: o.shop.city, country: o.shop.country },
      buyerName: o.buyerName,
      buyerPhone: o.buyerPhone,
      buyerCountry: o.buyerCountry,
      quantity: o.quantity,
      message: o.message,
      status: o.status,
      isDemo: o.isDemo,
      createdAt: o.createdAt,
    })),
  })
}

// ---- PATCH : vendeur / régie met à jour le statut d'une commande ----
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const body = await req.json()
  const allowed = ['NEW', 'CONFIRMED', 'DELIVERED', 'CANCELLED']
  if (!body?.id || !allowed.includes(body.status)) {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  const order = await db.order.findUnique({ where: { id: body.id }, include: { shop: true } })
  if (!order) return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 })
  if (user.role !== 'ADMIN' && order.shop.ownerId !== user.id) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 403 })
  }
  await db.order.update({ where: { id: order.id }, data: { status: body.status } })
  return NextResponse.json({ ok: true })
}
