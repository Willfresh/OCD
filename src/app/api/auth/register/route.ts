import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, createSession, publicUser } from '@/lib/ocd/auth'
import { COUNTRY_MAP } from '@/lib/ocd/constants'

const schema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(60),
  email: z.string().trim().toLowerCase().email('E-mail invalide'),
  password: z.string().min(6, 'Mot de passe : 6 caractères minimum').max(100),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().trim().max(40).optional().or(z.literal('')),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      )
    }
    const { name, email, password, phone, country, city } = parsed.data
    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet e-mail.' }, { status: 409 })
    }
    if (country && !COUNTRY_MAP[country]) {
      return NextResponse.json({ error: 'Pays non reconnu.' }, { status: 400 })
    }
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        phone: phone || null,
        country: country || null,
        city: city || null,
        role: 'VENDOR',
      },
    })
    await createSession(user.id)
    return NextResponse.json({ user: publicUser(user) }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur, réessayez.' }, { status: 500 })
  }
}
