import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { autoExpireLives, computeLiveStatus } from '@/lib/ocd/live-status'
import { COUNTRIES } from '@/lib/ocd/constants'

// Compteurs RÉELS calculés à partir des lives validés et actifs
export async function GET() {
  try {
    await autoExpireLives()
    const [lives, shops, products, vendors] = await Promise.all([
      db.liveSubmission.findMany({ where: { status: 'VALIDATED' }, include: { shop: true } }),
      db.shop.findMany({ where: { isActive: true } }),
      db.product.findMany({ where: { isActive: true } }),
      db.user.count({ where: { role: 'VENDOR' } }),
    ])

    const computed = lives.map((l) => computeLiveStatus(l))
    const countries = COUNTRIES.map((c) => {
      const forCountry = computed.filter((x) => x.live.country === c.code)
      return {
        code: c.code,
        name: c.name,
        flag: c.flag,
        enDirect: forCountry.filter((x) => x.status === 'LIVE').length,
        prochainsAujourdhui: forCountry.filter((x) => x.status === 'UPCOMING_TODAY').length,
        boutiques: shops.filter((s) => s.country === c.code).length,
      }
    }).filter((c) => c.enDirect + c.prochainsAujourdhui + c.boutiques > 0)
      .sort((a, b) => b.enDirect - a.enDirect || b.prochainsAujourdhui - a.prochainsAujourdhui)

    const slotsOpen = computed.some((x) => x.status === 'LIVE')

    return NextResponse.json({
      totals: {
        enDirect: computed.filter((x) => x.status === 'LIVE').length,
        prochainsAujourdhui: computed.filter((x) => x.status === 'UPCOMING_TODAY').length,
        pays: countries.length,
        boutiques: shops.length,
        produits: products.length,
        vendeurs: vendors,
        slotsOpen,
      },
      countries,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
