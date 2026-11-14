'use client'

import { create } from 'zustand'

export interface AppUser {
  id: string
  name: string
  email: string
  role: string
  country: string | null
  city: string | null
  phone: string | null
  avatarUrl: string | null
  isDemo: boolean
  createdAt: string
}
export interface AppShop {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}
export interface AppSub {
  endDate: string
  status: string
  isDemo: boolean
}
export interface ToastItem {
  id: number
  msg: string
  kind: 'ok' | 'bad' | 'info'
}

export interface Route {
  path: string[] // ex. ['live'] pour #/live, ['boutique', slug]
  query: URLSearchParams
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/'
  const [p, q] = raw.split('?')
  const path = p.split('/').filter(Boolean)
  return { path, query: new URLSearchParams(q || '') }
}

interface AppState {
  route: Route
  user: AppUser | null
  shop: AppShop | null
  subscription: AppSub | null
  stats: {
    totals: Record<string, number>
    countries: { code: string; name: string; flag: string; enDirect: number; prochainsAujourdhui: number; boutiques: number }[]
  } | null
  toasts: ToastItem[]
  menuOpen: boolean
  introDone: boolean
  setRoute: (r: Route) => void
  navigate: (to: string) => void
  setMenuOpen: (v: boolean) => void
  refreshUser: () => Promise<void>
  refreshStats: () => Promise<void>
  logout: () => Promise<void>
  toast: (msg: string, kind?: ToastItem['kind']) => void
  dismissToast: (id: number) => void
  setIntroDone: () => void
}

export const useApp = create<AppState>((set, get) => ({
  route: { path: [], query: new URLSearchParams() },
  user: null,
  shop: null,
  subscription: null,
  stats: null,
  toasts: [],
  menuOpen: false,
  introDone: false,
  setRoute: (r) => set({ route: r, menuOpen: false }),
  navigate: (to) => {
    if (typeof window !== 'undefined') window.location.hash = to.startsWith('#') ? to.slice(1) : to
  },
  setMenuOpen: (v) => set({ menuOpen: v }),
  refreshUser: async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      set({ user: data.user, shop: data.shop, subscription: data.subscription })
    } catch {
      /* hors ligne */
    }
  },
  refreshStats: async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.totals) set({ stats: data })
    } catch {
      /* hors ligne */
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* la session locale est close dans tous les cas */
    }
    set({ user: null, shop: null, subscription: null })
    get().toast('Vous êtes déconnecté — à bientôt sur OCD !', 'info')
    get().navigate('/')
  },
  toast: (msg, kind = 'info') => {
    const id = Date.now() + Math.random()
    set({ toasts: [...get().toasts, { id, msg, kind }] })
    setTimeout(() => get().dismissToast(id), 4600)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  setIntroDone: () => set({ introDone: true }),
}))

export async function api<T = Record<string, unknown>>(
  path: string,
  opts?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method ?? 'GET',
    headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  })
  let data: Record<string, unknown> = {}
  try {
    data = await res.json()
  } catch {}
  if (!res.ok) {
    throw new Error((data.error as string) || (data.message as string) || `Erreur (${res.status})`)
  }
  return data as T
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function fmtPrice(price: number, currency: string) {
  const labels: Record<string, string> = { XOF: 'FCFA', NGN: '₦', GHS: 'GH₵', GNF: 'GNF', CDF: 'FC' }
  const label = labels[currency] ?? currency
  return `${Math.round(price).toLocaleString('fr-FR')} ${label}`
}

export function fmtDate(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

/* Normalisation pour la recherche : minuscules + accents retirés.
   « Beauté » et « beaute » se trouvent mutuellement, sur toutes les pages. */
export function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function fmtDateTime(d: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}
