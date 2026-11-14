import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/ocd/auth'
import { computeLiveStatus } from '@/lib/ocd/live-status'

// ---- GET : vue d'ensemble régie OCD Bovann ----
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  const [
    pendingLives,
    validatedLives,
    rejectedLives,
    endedLives,
    vendors,
    totalUsers,
    shops,
    products,
    orders,
    subs,
    payments,
    revenue,
    shopRows,
    orderRows,
    paymentRows,
    recentLives,
  ] = await Promise.all([
    db.liveSubmission.count({ where: { status: 'PENDING' } }),
    db.liveSubmission.findMany({ where: { status: 'VALIDATED' }, include: { shop: true } }),
    db.liveSubmission.count({ where: { status: 'REJECTED' } }),
    db.liveSubmission.count({ where: { status: 'ENDED' } }),
    db.user.count({ where: { role: 'VENDOR', isDemo: false } }),
    db.user.count(),
    db.shop.count(),
    db.product.count(),
    db.order.count(),
    db.subscription.count({ where: { status: 'ACTIVE', endDate: { gt: new Date() } } }),
    db.payment.count(),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'SUCCESS' } }),
    db.shop.findMany({
      include: { owner: true, products: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.order.findMany({ include: { product: true, shop: true }, orderBy: { createdAt: 'desc' }, take: 40 }),
    db.payment.findMany({ include: { vendor: true }, orderBy: { createdAt: 'desc' }, take: 40 }),
    db.liveSubmission.findMany({ include: { vendor: true }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ])

  const computed = validatedLives.map((l) => computeLiveStatus(l))
  const liveNow = computed.filter((c) => c.status === 'LIVE').length
  const upcoming = computed.filter((c) => c.status === 'UPCOMING_TODAY').length

  const byCountry = new Map<string, { enDirect: number; prochains: number; boutiques: number }>()
  for (const c of computed) {
    const cur = byCountry.get(c.live.country) ?? { enDirect: 0, prochains: 0, boutiques: 0 }
    if (c.status === 'LIVE') cur.enDirect++
    if (c.status === 'UPCOMING_TODAY') cur.prochains++
    byCountry.set(c.live.country, cur)
  }
  for (const s of shopRows) {
    const cur = byCountry.get(s.country) ?? { enDirect: 0, prochains: 0, boutiques: 0 }
    cur.boutiques++
    byCountry.set(s.country, cur)
  }

  const byCategory = new Map<string, number>()
  for (const c of computed) {
    byCategory.set(c.live.category, (byCategory.get(c.live.category) ?? 0) + 1)
  }

  return NextResponse.json({
    stats: {
      pending: pendingLives,
      liveNow,
      upcoming,
      rejected: rejectedLives,
      ended: endedLives,
      vendors,
      usersTotal: totalUsers,
      shops,
      products,
      orders,
      activeSubscriptions: subs,
      payments: payments,
      revenue: revenue._sum.amount ?? 0,
    },
    recentLives: recentLives.map((l) => ({
      id: l.id,
      displayName: l.displayName,
      vendorName: l.vendor.name,
      country: l.country,
      status: l.status,
      isDemo: l.isDemo,
      createdAt: l.createdAt,
    })),
    byCountry: Array.from(byCountry.entries()).map(([code, v]) => ({ code, ...v })),
    byCategory: Array.from(byCategory.entries()).map(([id, count]) => ({ id, count })),
    shops: shopRows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      country: s.country,
      city: s.city,
      category: s.category,
      owner: { name: s.owner.name, email: s.owner.email, isDemo: s.owner.isDemo },
      productCount: s.products.length,
      isActive: s.isActive,
      isDemo: s.isDemo,
      createdAt: s.createdAt,
    })),
    orders: orderRows.map((o) => ({
      id: o.id,
      product: o.product?.name ?? '—',
      shop: o.shop.name,
      buyerName: o.buyerName,
      buyerPhone: o.buyerPhone,
      quantity: o.quantity,
      status: o.status,
      isDemo: o.isDemo,
      createdAt: o.createdAt,
    })),
    payments: paymentRows.map((p) => ({
      reference: p.reference,
      amount: p.amount,
      method: p.method,
      provider: p.provider,
      status: p.status,
      vendor: { name: p.vendor.name, email: p.vendor.email, isDemo: p.vendor.isDemo },
      createdAt: p.createdAt,
    })),
  })
}
