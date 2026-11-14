import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser, publicUser, verifyPassword, hashPassword } from '@/lib/ocd/auth'
import { COUNTRIES } from '@/lib/ocd/constants'

// ---- PATCH : mettre à jour mon profil (nom, téléphone, pays, ville, avatar) ----
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom complet').max(60),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  country: z
    .string()
    .refine((v) => !v || COUNTRIES.some((c) => c.code === v), 'Pays non reconnu')
    .optional()
    .or(z.literal('')),
  city: z.string().trim().max(40).optional().or(z.literal('')),
  avatarUrl: z.string().trim().max(300).optional().or(z.literal('')),
})

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Connectez-vous d'abord." }, { status: 401 })
  const parsed = profileSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
  }
  const d = parsed.data
  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      phone: d.phone || null,
      country: d.country || null,
      city: d.city || null,
      avatarUrl: d.avatarUrl || null,
    },
  })
  return NextResponse.json({ user: publicUser(updated) })
}

// ---- POST : changer mon mot de passe ----
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(6, 'Nouveau mot de passe : 6 caractères minimum').max(72),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Connectez-vous d'abord." }, { status: 401 })
  const parsed = passwordSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
  }
  const { currentPassword, newPassword } = parsed.data
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 400 })
  }
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  })
  // Sécurité : le mot de passe vient de changer — on ferme les autres sessions
  const jar = req.cookies
  const token = jar.get('ocd_session')?.value
  if (token) {
    await db.session.deleteMany({ where: { userId: user.id, token: { not: token } } })
  }
  return NextResponse.json({ ok: true })
}
