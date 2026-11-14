import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/ocd/auth'
import { computeLiveStatus, autoExpireLives } from '@/lib/ocd/live-status'

// ---- GET : file de validation + lives gérés (tableau de bord régie) ----
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  await autoExpireLives()
  const lives = await db.liveSubmission.findMany({
    include: { shop: true, vendor: true },
    orderBy: [{ createdAt: 'desc' }],
  })
  return NextResponse.json({
    lives: lives.map((l) => {
      const c = l.status === 'VALIDATED' ? computeLiveStatus(l) : null
      return {
        id: l.id,
        displayName: l.displayName,
        vendorName: l.vendor.name,
        vendorEmail: l.vendor.email,
        vendorPhone: l.vendor.phone,
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
        isDemo: l.isDemo,
        runtimeStatus: c ? c.status : null,
        startsAtLabel: c ? c.startsAtLabel : null,
        shop: l.shop ? { name: l.shop.name, slug: l.shop.slug } : null,
        isDemoVendor: l.vendor.isDemo,
      }
    }),
  })
}

// ---- PATCH : accepter / refuser / terminer un live ----
const actionSchema = z.object({
  id: z.string(),
  action: z.enum(['accept', 'refuse', 'end']),
  reason: z.string().trim().max(300).optional().or(z.literal('')),
})

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  const parsed = actionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Action invalide.' }, { status: 400 })
  }
  const { id, action, reason } = parsed.data
  const live = await db.liveSubmission.findUnique({ where: { id } })
  if (!live) return NextResponse.json({ error: 'Live introuvable.' }, { status: 404 })

  if (action === 'refuse') {
    if (!reason || reason.length < 3) {
      return NextResponse.json({ error: 'Indiquez un motif de refus.' }, { status: 400 })
    }
    await db.liveSubmission.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason, reviewedById: admin.id, reviewedAt: new Date() },
    })
    return NextResponse.json({ ok: true, status: 'REJECTED' })
  }
  if (action === 'accept') {
    await db.liveSubmission.update({
      where: { id },
      data: { status: 'VALIDATED', rejectionReason: null, reviewedById: admin.id, reviewedAt: new Date() },
    })
    return NextResponse.json({ ok: true, status: 'VALIDATED' })
  }
  // end : terminer manuellement le créneau de visibilité
  await db.liveSubmission.update({
    where: { id },
    data: { status: 'ENDED', reviewedById: admin.id, reviewedAt: new Date() },
  })
  return NextResponse.json({ ok: true, status: 'ENDED' })
}
