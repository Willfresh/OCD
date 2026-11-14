import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, publicUser } from '@/lib/ocd/auth'
import { getActiveSubscription } from '@/lib/ocd/live-status'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ user: null })
  const shop = await db.shop.findUnique({ where: { ownerId: user.id } })
  const subscription = await getActiveSubscription(user.id)
  return NextResponse.json({
    user: publicUser(user),
    shop: shop ? { id: shop.id, name: shop.name, slug: shop.slug, logoUrl: shop.logoUrl } : null,
    subscription: subscription
      ? { endDate: subscription.endDate, status: subscription.status, isDemo: subscription.isDemo }
      : null,
  })
}
