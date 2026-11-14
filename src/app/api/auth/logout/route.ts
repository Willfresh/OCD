import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/ocd/auth'

export async function POST() {
  await destroySession()
  return NextResponse.json({ ok: true })
}
