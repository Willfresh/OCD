import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { requireVendor } from '@/lib/ocd/auth'
import { getActiveSubscription } from '@/lib/ocd/live-status'
import { COUNTRY_MAP, SUBSCRIPTION_DAYS, SUBSCRIPTION_PRICE } from '@/lib/ocd/constants'

// ---- GET : abonnement courant + historique des paiements ----
export async function GET() {
  const vendor = await requireVendor()
  if (!vendor) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const subs = await db.subscription.findMany({
    where: { vendorId: vendor.id },
    include: { payments: true },
    orderBy: { endDate: 'desc' },
  })
  const active = subs.find((s) => s.endDate > new Date() && s.status === 'ACTIVE') ?? null
  const payments = await db.payment.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({
    active: active
      ? { endDate: active.endDate, startDate: active.startDate, amount: active.amount, isDemo: active.isDemo }
      : null,
    history: subs.map((s) => ({ startDate: s.startDate, endDate: s.endDate, status: s.status, amount: s.amount, isDemo: s.isDemo })),
    payments: payments.map((p) => ({
      reference: p.reference,
      amount: p.amount,
      method: p.method,
      provider: p.provider,
      status: p.status,
      createdAt: p.createdAt,
    })),
    price: SUBSCRIPTION_PRICE,
  })
}

// ---- POST : payer et activer l'abonnement (paiement SIMULÉ, clairement identifié) ----
const schema = z.object({
  method: z.enum(['momo', 'card']),
  provider: z.string().trim().min(2).max(30),
  phone: z.string().trim().optional().or(z.literal('')),
  card: z.string().trim().optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  const vendor = await requireVendor()
  if (!vendor) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
      { status: 400 },
    )
  }
  const { method, provider, phone, card } = parsed.data
  if (method === 'momo' && (!phone || phone.replace(/\D/g, '').length < 8)) {
    return NextResponse.json({ error: 'Numéro Mobile Money invalide.' }, { status: 400 })
  }
  if (method === 'card' && (!card || card.replace(/\D/g, '').length < 12)) {
    return NextResponse.json({ error: 'Numéro de carte invalide.' }, { status: 400 })
  }
  const country = vendor.country ? COUNTRY_MAP[vendor.country] : null
  if (method === 'momo' && country && !country.momo.includes(provider)) {
    return NextResponse.json(
      { error: `Opérateur non disponible dans votre pays. Choisissez : ${country.momo.join(', ')}.` },
      { status: 400 },
    )
  }

  // Prolongation depuis la fin actuelle si abonnement encore actif
  const current = await getActiveSubscription(vendor.id)
  const base = current ? current.endDate : new Date()
  const endDate = new Date(base.getTime() + SUBSCRIPTION_DAYS * 24 * 3600 * 1000)
  const reference = 'OCD-' + randomBytes(4).toString('hex').toUpperCase()

  const payment = await db.payment.create({
    data: {
      vendorId: vendor.id,
      purpose: 'SUBSCRIPTION',
      amount: SUBSCRIPTION_PRICE,
      currency: 'XOF',
      method,
      provider,
      reference,
      status: 'SUCCESS',
    },
  })
  const subscription = await db.subscription.create({
    data: {
      vendorId: vendor.id,
      startDate: current ? current.endDate : new Date(),
      endDate,
      amount: SUBSCRIPTION_PRICE,
      currency: 'XOF',
      status: 'ACTIVE',
      method,
      provider,
      payments: { connect: { id: payment.id } },
    },
  })
  return NextResponse.json({
    ok: true,
    simulated: true, // aucune transaction réelle — intégration PSP à brancher en production
    subscription: { endDate: subscription.endDate, amount: subscription.amount },
    payment: { reference: payment.reference, amount: payment.amount, method: payment.method, provider: payment.provider },
  })
}
