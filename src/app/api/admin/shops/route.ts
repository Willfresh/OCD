import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/ocd/auth'

// Modération des boutiques par la régie : activer / désactiver
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  const body = await req.json()
  if (!body?.id || typeof body.isActive !== 'boolean') {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
  const shop = await db.shop.findUnique({ where: { id: body.id } })
  if (!shop) return NextResponse.json({ error: 'Boutique introuvable.' }, { status: 404 })
  await db.shop.update({ where: { id: shop.id }, data: { isActive: body.isActive } })
  return NextResponse.json({ ok: true, isActive: body.isActive })
}
