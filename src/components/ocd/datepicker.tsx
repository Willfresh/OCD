'use client'

// Calendrier de réservation — choix du jour du live (assistant de soumission).
// Grille mensuelle compacte, cohérente avec le design OCD (orange / crème / cartes) :
//  - jours passés désactivés ;
//  - réservation possible de aujourd'hui jusqu'à `maxDays` jours à l'avance ;
//  - raccourcis « Aujourd'hui / Demain » gérés par le composant parent.

import React, { useEffect, useMemo, useState } from 'react'

const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const pad = (n: number) => String(n).padStart(2, '0')
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

const dayLabel = (k: string) =>
  new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(k))

export function OcdDatePicker({
  value,
  onChange,
  maxDays = 60,
}: {
  value: string // '' ou 'yyyy-mm-dd'
  onChange: (iso: string) => void
  maxDays?: number
}) {
  // Aujourd'hui et horizon de réservation (dates locales, hors décalage UTC)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const max = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + maxDays)
    return d
  }, [today, maxDays])

  const todayKey = toKey(today)
  const maxKey = toKey(max)

  // Mois affiché : celui de la date sélectionnée, sinon le mois courant
  const selMonth = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number)
      return { y, m: m - 1 }
    }
    return { y: today.getFullYear(), m: today.getMonth() }
  }, [value, today])
  const [view, setView] = useState(selMonth)
  useEffect(() => setView(selMonth), [selMonth])

  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(view.y, view.m, 1))

  // Grille : remplissage jusqu'au lundi précédent + tous les jours du mois
  const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7 // lundi = 0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (string | null)[] = Array.from({ length: offset }, () => null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${view.y}-${pad(view.m + 1)}-${pad(d)}`)
  }

  // Navigation limitée à la fenêtre de réservation
  const monthStart = (y: number, m: number) => new Date(y, m, 1)
  const canPrev = monthStart(view.y, view.m) > monthStart(today.getFullYear(), today.getMonth())
  const canNext = monthStart(view.y, view.m + 1) <= monthStart(max.getFullYear(), max.getMonth())
  const move = (dir: 1 | -1) => {
    setView((v) => {
      const m = v.m + dir
      return { y: m < 0 ? v.y - 1 : m > 11 ? v.y + 1 : v.y, m: (m + 12) % 12 }
    })
  }

  const maxLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(max)

  return (
    <div className="cal" role="group" aria-label="Choisir la date du live">
      <div className="cal-head">
        <button
          type="button"
          className="cal-nav"
          onClick={() => move(-1)}
          disabled={!canPrev}
          aria-label="Mois précédent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <p className="cal-title" aria-live="polite">{monthLabel}</p>
        <button
          type="button"
          className="cal-nav"
          onClick={() => move(1)}
          disabled={!canNext}
          aria-label="Mois suivant"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div className="cal-grid" role="grid" aria-label={`Jours de ${monthLabel}`}>
        {DOW.map((d, i) => (
          <span key={i} className="cal-dow" aria-hidden="true">{d}</span>
        ))}
        {cells.map((key, i) => {
          if (!key) return <span key={`e${i}`} className="cal-day cal-empty" aria-hidden="true" />
          const disabled = key < todayKey || key > maxKey
          const sel = key === value
          const isToday = key === todayKey
          return (
            <button
              key={key}
              type="button"
              className={`cal-day${sel ? ' sel' : ''}${isToday ? ' today' : ''}`}
              onClick={() => onChange(key)}
              disabled={disabled}
              aria-pressed={sel}
              aria-label={
                disabled
                  ? `${dayLabel(key)} — indisponible`
                  : `Choisir ${dayLabel(key)}${isToday ? " (aujourd'hui)" : ''}`
              }
            >
              {Number(key.slice(8))}
            </button>
          )
        })}
      </div>

      <p className="cal-legend">
        <span><span className="cal-dot" /> aujourd&apos;hui</span>
        <span><span className="cal-dot cal-dot-sel" /> jour choisi</span>
        <span className="cal-max">réservable jusqu&apos;au {maxLabel}</span>
      </p>
    </div>
  )
}
