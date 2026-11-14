'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useApp, api, norm } from './store'
import { LoadingCards, EmptyState } from './chrome'
import { Flag } from './Flag'
import { CatIcon, PlatformIcon } from './icons'
import { CATEGORIES, COUNTRIES, COUNTRY_MAP, CATEGORY_MAP } from '@/lib/ocd/constants'

export interface PublicLive {
  id: string
  displayName: string
  photoUrl: string | null
  country: string
  category: string
  slot: string
  mode: string
  platform: string
  liveUrl: string | null
  isDemo: boolean
  status: 'LIVE' | 'UPCOMING_TODAY' | 'UPCOMING'
  startsAtLabel: string
  endsAtLabel: string
  shop: { id: string; name: string; slug: string; logoUrl: string | null; city: string } | null
}

// Heure du visiteur — décalage UTC du navigateur (fiable partout)
function nowLocal() {
  const off = -new Date().getTimezoneOffset() / 60 // décalage horaire du visiteur en heures
  const shifted = new Date(Date.now() + off * 3600 * 1000)
  const hh = String(shifted.getUTCHours()).padStart(2, '0')
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0')
  const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date())
  return { hm: `${hh}h${mm}`, h: shifted.getUTCHours() + shifted.getUTCMinutes() / 60, date }
}

export function LiveView() {
  const { route, navigate } = useApp()
  const [lives, setLives] = useState<PublicLive[] | null>(null)
  const [country, setCountry] = useState<string>(route.query.get('country') ?? '')
  const [category, setCategory] = useState<string>(route.query.get('category') ?? '')
  const [q, setQ] = useState<string>(route.query.get('q') ?? '')
  const [liveOnly, setLiveOnly] = useState<boolean>(route.query.get('live') === '1')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const qs = new URLSearchParams()
    if (country) qs.set('country', country)
    if (category) qs.set('category', category)
    api<{ lives: PublicLive[] }>(`/api/lives?${qs}`)
      .then((d) => setLives(d.lives))
      .catch(() => setLives([]))
  }, [country, category, tick])

  // Rafraîchit le statut des lives toutes les 60 s (fiches qui apparaissent / disparaissent)
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60000)
    return () => clearInterval(t)
  }, [])

  // Filtres mémorisés dans l'URL (#/live?q=awa&country=BJ…) : lien partageable, retour navigateur conservé.
  // replaceState ne déclenche pas hashchange → aucun rechargement de la page.
  useEffect(() => {
    const qs = new URLSearchParams()
    if (q.trim()) qs.set('q', q.trim())
    if (country) qs.set('country', country)
    if (category) qs.set('category', category)
    if (liveOnly) qs.set('live', '1')
    const s = qs.toString()
    history.replaceState(null, '', window.location.pathname + (s ? `#/live?${s}` : '#/live'))
  }, [q, country, category, liveOnly])

  // Recherche locale, insensible à la casse ET aux accents : nom du vendeur, boutique,
  // ville, pays, catégorie, plateforme. La liste étant petite, tout se fait côté visiteur.
  const visible = useMemo(() => {
    const needle = norm(q.trim())
    return (lives ?? []).filter((l) => {
      if (liveOnly && l.status !== 'LIVE') return false
      if (!needle) return true
      const hay = norm(
        [
          l.displayName,
          l.shop?.name ?? '',
          l.shop?.city ?? '',
          COUNTRY_MAP[l.country]?.name ?? '',
          CATEGORY_MAP[l.category]?.label ?? '',
          l.platform,
          l.slot === 'MATIN' ? 'matin' : 'soir',
        ].join(' '),
      )
      return hay.includes(needle)
    })
  }, [lives, q, liveOnly])

  const enDirect = visible.filter((l) => l.status === 'LIVE')
  // À venir : sessions du jour, puis sessions programmées (datées, ex : 15 novembre)
  const aVenir = visible
    .filter((l) => l.status !== 'LIVE')
    .sort((a, b) => (a.status === 'UPCOMING_TODAY' ? 0 : 1) - (b.status === 'UPCOMING_TODAY' ? 0 : 1))
  const filtersActive = q.trim() !== '' || liveOnly || country !== '' || category !== ''
  const resetFilters = () => {
    setQ('')
    setLiveOnly(false)
    setCountry('')
    setCategory('')
  }

  // État des créneaux (heure locale du visiteur)
  const now = nowLocal()
  const h = now.h
  const slotState = (start: number, end: number) => (h >= start && h < end ? 'on' : h < start ? 'next' : 'past')

  const countsByCountry = useMemo(() => {
    const m = new Map<string, { enDirect: number; aVenir: number }>()
    for (const l of lives ?? []) {
      const cur = m.get(l.country) ?? { enDirect: 0, aVenir: 0 }
      if (l.status === 'LIVE') cur.enDirect++
      else cur.aVenir++
      m.set(l.country, cur)
    }
    return m
  }, [lives])

  // Compte à rebours jusqu'à la prochaine ouverture de créneau
  const nextSlotIn = () => {
    const morning = { start: 8, end: 11 }
    const evening = { start: 18, end: 21 }
    for (const s of [morning, evening]) {
      if (h >= s.start && h < s.end) return null // un créneau est en cours
    }
    // prochaine ouverture : aujourd'hui (matin ou soir) ou demain matin
    let target: number
    if (h < morning.start) target = morning.start
    else if (h < evening.start) target = evening.start
    else target = morning.start + 24
    const mins = Math.round((target - h) * 60)
    const hh = Math.floor(mins / 60)
    const mm = mins % 60
    return hh > 0 ? `${hh} h ${String(mm).padStart(2, '0')}` : `${mm} min`
  }
  const countdown = nextSlotIn()

  return (
    <main className="section" style={{ paddingTop: 120, paddingBottom: 60 }}>
      <p className="eyebrow">OCD Live — les vendeurs en direct</p>
      <h1 className="sec-title">En direct pays par pays</h1>
      <p className="sec-sub">
        Chaque fiche est validée par la régie OCD Bovann avant publication. Cliquez sur « Regarder » pour ouvrir le
        live d&apos;origine sur sa plateforme (TikTok, YouTube, Facebook).
      </p>

      {/* Bandeau des créneaux du jour */}
      <div className="session-banner" style={{ marginTop: 30 }}>
        <strong style={{ fontWeight: 900, fontSize: '0.98rem' }}>Créneaux du jour — {now.date}</strong>
        <div className="session-clock">
          <span className={`clock-pill ${slotState(8, 11)}`}>
            {slotState(8, 11) === 'on' && <span className="pulse-dot" style={{ background: '#0A0908' }} />}
            Matin 08h–11h {slotState(8, 11) === 'on' ? '· EN COURS' : slotState(8, 11) === 'next' ? '· à venir' : '· terminé'}
          </span>
          <span className={`clock-pill ${slotState(18, 21)}`}>
            {slotState(18, 21) === 'on' && <span className="pulse-dot" style={{ background: '#0A0908' }} />}
            Soir 18h–21h {slotState(18, 21) === 'on' ? '· EN COURS' : slotState(18, 21) === 'next' ? '· à venir' : '· terminé'}
          </span>
          <span className="clock-pill">Il est {now.hm} chez vous</span>
          {countdown && (
            <span className="clock-pill next">Prochaine session dans {countdown}</span>
          )}
        </div>
        <span className="badge" style={{ marginLeft: 'auto', textTransform: 'none', letterSpacing: 0 }}>
          <b style={{ color: 'var(--accent-strong)' }}>{enDirect.length}</b>&nbsp;en direct · {aVenir.length} à venir
        </span>
      </div>

      {/* Recherche + filtre « en direct » */}
      <div className="fgrid" style={{ gridTemplateColumns: '1fr 230px', marginTop: 26, alignItems: 'start' }}>
        <div className="field">
          <label htmlFor="live-q">Rechercher un live</label>
          <input
            id="live-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom du vendeur, boutique, ville, catégorie, plateforme…"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label>Filtrer l&apos;affichage</label>
          <button
            type="button"
            className={`cat-chip ${liveOnly ? 'sel' : ''}`}
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => setLiveOnly(!liveOnly)}
            aria-pressed={liveOnly}
          >
            <span className="pulse-dot" style={{ width: 7, height: 7 }} aria-hidden="true" />
            En direct uniquement
          </button>
        </div>
      </div>

      {/* Navigation par pays */}
      <h2 style={{ marginTop: 40, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Pays</h2>
      <div className="country-grid" style={{ marginTop: 16 }}>
        <button className={`country-card ${!country ? 'sel' : ''}`} onClick={() => setCountry('')}>
          <span className="cc-txt">
            <span className="cc-name" style={{ color: !country ? 'var(--accent-strong)' : undefined }}>Tous les pays</span>
            <span className="cc-count">
              {lives
                ? `${(lives ?? []).filter((l) => l.status === 'LIVE').length} en direct · ${
                    (lives ?? []).filter((l) => l.status !== 'LIVE').length
                  } à venir`
                : '…'}
            </span>
          </span>
        </button>
        {COUNTRIES.map((c) => {
          const cc = countsByCountry.get(c.code)
          const shown = country === c.code
          return (
            <button
              key={c.code}
              className={`country-card ${shown ? 'sel' : ''}`}
              onClick={() => setCountry(shown ? '' : c.code)}
            >
              <Flag code={c.code} size={24} />
              <span className="cc-txt">
                <span className="cc-name">{c.name}</span>
                <span className="cc-count">
                  {cc ? (
                    <>
                      <b>{cc.enDirect}</b> en direct{cc.aVenir > 0 ? ` · ${cc.aVenir} à venir` : ''}
                    </>
                  ) : (
                    'Aucun live actif'
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Filtres par catégorie */}
      <h2 style={{ marginTop: 34, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Catégorie</h2>
      <div className="cat-chips" style={{ marginTop: 14 }}>
        <button className={`cat-chip ${!category ? 'sel' : ''}`} onClick={() => setCategory('')}>
          Toutes
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`cat-chip ${category === c.id ? 'sel' : ''}`}
            onClick={() => setCategory(category === c.id ? '' : c.id)}
          >
            <CatIcon id={c.icon} size={15} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Grille des vendeurs */}
      <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          {q.trim()
            ? `Résultats pour « ${q.trim()} » — ${visible.length} fiche${visible.length > 1 ? 's' : ''}`
            : country
              ? COUNTRY_MAP[country]?.name
              : 'Tous les pays'}{' '}
          {q.trim() ? '' : `— ${enDirect.length} en direct${aVenir.length > 0 ? ` · ${aVenir.length} à venir` : ''}`}
        </h2>
        {filtersActive && (
          <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
            ✕ Réinitialiser les filtres
          </button>
        )}
      </div>
      {lives === null ? (
        <div style={{ marginTop: 22 }}><LoadingCards n={6} /></div>
      ) : visible.length === 0 ? (
        <div style={{ marginTop: 22 }}>
          <EmptyState
            title={
              q.trim()
                ? liveOnly
                  ? `Aucun vendeur en direct ne correspond à « ${q.trim()} »`
                  : `Aucun live ne correspond à « ${q.trim()} »`
                : liveOnly
                  ? 'Aucun vendeur en direct pour le moment'
                  : 'Aucun live dans cette sélection'
            }
            sub={
              q.trim()
                ? 'Vérifiez l\u2019orthographe ou effacez la recherche — les vendeurs du créneau s\u2019affichent tous.'
                : liveOnly
                  ? 'Les lives validés apparaissent pendant les créneaux (08h–11h et 18h–21h, heure de chaque pays). Revenez au prochain créneau !'
                  : `Les lives validés apparaissent pendant les créneaux (08h–11h et 18h–21h, heure de chaque pays). ${
                      country ? `Revenez au créneau suivant pour ${COUNTRY_MAP[country]?.name}.` : 'Revenez au prochain créneau.'
                    }`
            }
          />
        </div>
      ) : (
        <div className="live-grid" style={{ marginTop: 22 }}>
          {[...enDirect, ...aVenir].map((l) => (
            <LiveCard key={l.id} live={l} onShop={(slug) => navigate(`/boutique/${slug}`)} />
          ))}
        </div>
      )}
    </main>
  )
}

export function LiveCard({ live: l, onShop }: { live: PublicLive; onShop: (slug: string) => void }) {
  const isLive = l.status === 'LIVE'
  return (
    <article className={`live-card ${isLive ? 'is-live' : ''}`}>
      <div className="lc-photo">
        {l.photoUrl ? (
          <img src={l.photoUrl} alt={l.displayName} loading="lazy" />
        ) : (
          <div className="ph">{l.displayName.slice(0, 2).toUpperCase()}</div>
        )}
        <div className="lc-overlay">
          {isLive ? (
            <span className="badge badge-live-on"><span className="dot" />EN DIRECT</span>
          ) : (
            <span className="badge badge-wait">À VENIR · {l.startsAtLabel}</span>
          )}
          {l.isDemo && <span className="badge badge-demo">DÉMO</span>}
        </div>
      </div>
      <div className="lc-body">
        <span className="lc-name">
          {l.displayName}
          {l.mode === 'presentiel' && (
            <span className="badge" style={{ fontSize: '0.62rem', padding: '3px 8px' }}>Présentiel</span>
          )}
        </span>
        <span className="lc-meta">
          <Flag code={l.country} size={16} />
          {COUNTRY_MAP[l.country]?.name ?? l.country}
          {l.shop?.city && <>· {l.shop.city}</>}
          {l.shop && <>· <PlatformIcon platform={l.platform} size={13} /></>}
        </span>
        <span className="lc-cat">
          <CatIcon id={CATEGORY_MAP[l.category]?.icon ?? 'store'} size={13} />
          {CATEGORY_MAP[l.category]?.label ?? l.category}
        </span>
        <span className="lc-meta" style={{ fontSize: '0.78rem' }}>
          {l.slot === 'MATIN' ? 'Créneau matin 08h–11h' : 'Créneau soir 18h–21h'} · {l.endsAtLabel}
        </span>
        <div className="lc-actions">
          {l.liveUrl ? (
            <a className="btn btn-primary" href={l.liveUrl} target="_blank" rel="noopener">
              <PlatformIcon platform={l.platform} size={16} />
              Regarder le live
            </a>
          ) : (
            <a className="btn btn-primary" href={`https://www.tiktok.com/@houseofchallenge/live`} target="_blank" rel="noopener">
              <PlatformIcon platform="tiktok" size={16} />
              Voir sur l&apos;antenne OCD
            </a>
          )}
          {l.shop && (
            <button className="btn btn-ghost" onClick={() => onShop(l.shop!.slug)}>
              Boutique : {l.shop.name}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
