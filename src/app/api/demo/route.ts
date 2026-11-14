import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/ocd/auth'
import { seedDemoData } from '@/lib/ocd/seed'

// Recharge les données de démonstration (réservé à la régie)
export async function POST() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Accès réservé à la régie OCD.' }, { status: 403 })
  try {
    await seedDemoData()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur pendant le rechargement des données de démo.' }, { status: 500 })
  }
}
