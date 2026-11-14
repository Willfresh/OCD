import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, createSession, publicUser } from '@/lib/ocd/auth'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('E-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

export async function POST(req: NextRequest) {
  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      )
    }
    const user = await db.user.findUnique({ where: { email: parsed.data.email } })
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return NextResponse.json({ error: 'E-mail ou mot de passe incorrect.' }, { status: 401 })
    }
    await createSession(user.id)
    return NextResponse.json({ user: publicUser(user) })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur, réessayez.' }, { status: 500 })
  }
}
