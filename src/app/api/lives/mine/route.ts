import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireVendor } from '@/lib/ocd/auth'
import { computeLiveStatus } from '@/lib/ocd/live-status'

export async function GET() {
  const vendor = await requireVendor()
  if (!vendor) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const lives = await db.liveSubmission.findMany({
    where: { vendorId: vendor.id },
    include: { shop: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    lives: lives.map((l) => {
      const c = l.status === 'VALIDATED' ? computeLiveStatus(l) : null
      return {
        id: l.id,
        displayName: l.displayName,
        country: l.country,
        category: l.category,
        slot: l.slot,
        mode: l.mode,
        platform: l.platform,
        liveUrl: l.liveUrl,
        status: l.status,
        rejectionReason: l.rejectionReason,
        createdAt: l.createdAt,
        scheduledDate: l.scheduledDate,
        runtimeStatus: c ? c.status : null,
        startsAtLabel: c ? c.startsAtLabel : null,
        shop: l.shop ? { name: l.shop.name, slug: l.shop.slug } : null,
      }
    }),
  })
}
