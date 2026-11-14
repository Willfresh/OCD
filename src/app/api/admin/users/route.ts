import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/ocd/auth'

// ---- GET : liste des utilisateurs (vendeurs + régie) pour l'espace admin ----
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })

  const users = await db.user.findMany({
    include: {
      shop: { include: { _count: { select: { products: true, orders: true } } } },
      lives: true,
      subscriptions: { where: { status: 'ACTIVE', endDate: { gt: new Date() } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      country: u.country,
      city: u.city,
      avatarUrl: u.avatarUrl,
      isDemo: u.isDemo,
      createdAt: u.createdAt,
      shop: u.shop
        ? {
            name: u.shop.name,
            slug: u.shop.slug,
            isActive: u.shop.isActive,
            country: u.shop.country,
            city: u.shop.city,
            productCount: u.shop._count.products,
            ordersCount: u.shop._count.orders,
          }
        : null,
      livesCount: u.lives.length,
      activeLives: u.lives.filter((l) => l.status === 'VALIDATED').length,
      pendingLives: u.lives.filter((l) => l.status === 'PENDING').length,
      subscription: u.subscriptions[0] ? { endDate: u.subscriptions[0].endDate, isDemo: u.subscriptions[0].isDemo } : null,
    })),
  })
}
