'use client'

import React, { useEffect, useState } from 'react'
import { useApp } from './store'
import { CATEGORIES } from '@/lib/ocd/constants'

export function ThemeToggle() {
  const toggle = () => {
    const cur = document.documentElement.getAttribute('data-theme')
    const next = cur === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('ocd-theme', next)
    } catch {}
  }
  return (
    <button className="theme-btn" type="button" onClick={toggle} aria-label="Changer de thème" title="Thème clair / sombre">
      <svg className="ic-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      <svg className="ic-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
    </button>
  )
}

export function Intro() {
  const setIntroDone = useApp((s) => s.setIntroDone)
  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem('ocd-intro') === '1'
    } catch {}
    if (seen) {
      setIntroDone()
      return
    }
    const t = setTimeout(() => {
      setIntroDone()
      try {
        localStorage.setItem('ocd-intro', '1')
      } catch {}
    }, 2100)
    return () => clearTimeout(t)
  }, [setIntroDone])
  return (
    <div id="intro" aria-hidden="true" onClick={setIntroDone}>
      <div className="intro-inner">
        <p className="intro-k">House of Challenge présente</p>
        <div className="intro-logo">
          <img className="i-logo" src="/ocd/logo-ocd.png" alt="OCD Live" />
        </div>
        <p className="intro-s">L&apos;Opportunité C&apos;est Dehors</p>
      </div>
    </div>
  )
}

export function Header() {
  const { route, navigate, user, setMenuOpen, menuOpen, logout } = useApp()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [setMenuOpen])

  const on = (p: string) => route.path[0] === p
  const go = (to: string) => {
    setMenuOpen(false)
    navigate(to)
  }
  const isDash = route.path[0] === 'espace-vendeur' || route.path[0] === 'regie'

  return (
    <>
      <header className={`site-header ${scrolled || isDash ? 'scrolled' : ''}`}>
        <button className="brand" onClick={() => go('/')} aria-label="OCD Live — retour à l'accueil">
          <img className="brand-logo" src="/ocd/logo-ocd.png" alt="OCD Live — L'Opportunité C'est Dehors" />
        </button>
        <nav className="main-nav" aria-label="Navigation principale">
          <div className="nav-links">
            <button className={on('') && route.path.length === 0 ? 'on' : ''} onClick={() => go('/')}>Accueil</button>
            <button className={on('live') ? 'on' : ''} onClick={() => go('/live')}>OCD Live</button>
            <button className={on('shop') || on('boutique') ? 'on' : ''} onClick={() => go('/shop')}>OCD Shop</button>
            <button className={on('abonnement') ? 'on' : ''} onClick={() => go('/abonnement')}>Abonnement</button>
            <button className={on('regie') ? 'nav-regie on' : 'nav-regie'} onClick={() => go('/regie')} aria-label="Espace régie OCD Bovann">
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Espace régie</span>
            </button>
          </div>
          <ThemeToggle />
          {user && (
            <button
              className={`user-chip ${route.path[0] === 'profil' ? 'on' : ''}`}
              type="button"
              onClick={() => go('/profil')}
              aria-label="Mon profil"
              title="Mon profil — informations, mot de passe, déconnexion"
            >
              <span className="uc-ic" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <span className="uc-name">Profil</span>
            </button>
          )}
          {user ? (
            <button className="btn btn-primary btn-book" onClick={() => go(user.role === 'ADMIN' ? '/regie' : '/espace-vendeur')}>
              {user.role === 'ADMIN' ? 'Régie' : 'Mon espace'}
            </button>
          ) : (
            <button className="btn btn-primary btn-book" onClick={() => go('/soumettre')}>Soumettre mon live</button>
          )}
          <button
            className="menu-btn"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Ouvrir le menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </nav>
      </header>

      <div className="mobile-menu" id="mobile-menu">
        <nav className="mm-links" aria-label="Navigation mobile">
          <button onClick={() => go('/')}>Accueil</button>
          <button onClick={() => go('/live')}>OCD Live — vendeurs en direct</button>
          <button onClick={() => go('/shop')}>OCD Shop — boutiques</button>
          <button onClick={() => go('/abonnement')}>Abonnement vendeur</button>
          <button onClick={() => go('/soumettre')}>Soumettre mon live</button>
          <button onClick={() => go('/regie')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Espace régie
          </button>
          {user ? (
            <>
              <button onClick={() => go('/profil')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profil
              </button>
              <button onClick={() => go(user.role === 'ADMIN' ? '/regie' : '/espace-vendeur')}>Mon espace ({user.name.split(' ')[0]})</button>
              <button className="mm-logout" onClick={() => { setMenuOpen(false); logout() }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Se déconnecter
              </button>
            </>
          ) : (
            <button onClick={() => go('/connexion')}>Connexion / Inscription</button>
          )}
        </nav>
        <p className="mm-foot">OCD Live & Shop — House of Challenge · Lomé, Togo</p>
      </div>
    </>
  )
}

export function Marquee() {
  const txt = (
    <>
      L&apos;Opportunité C&apos;est Dehors ● OCD <b className="mk-live">LIVE</b> ● En direct sur TikTok ● Live en présentiel ● Live à distance ● OCD <b className="mk-live">SHOP</b> ● Bénin ● Togo ● Cameroun ● Côte d&apos;Ivoire ● Nigeria ● L&apos;Afrique qui se bat ● House of Challenge ●&nbsp;
    </>
  )
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>{txt}</span>
        <span>{txt}</span>
      </div>
    </div>
  )
}

export function WaFloat() {
  return (
    <a
      className="wa-float"
      href={`https://wa.me/4917658443070`}
      target="_blank"
      rel="noopener"
      aria-label="Contacter OCD sur WhatsApp"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.44-.72-2.92-1.15-4.76-4.2-4.9-4.4-.15-.2-1.17-1.56-1.17-2.97 0-1.41.73-2.1 1-2.39.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.56.8 1.95.87 2.09.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.66.78 1.94.92.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>
    </a>
  )
}

/* ---------- Retour en haut de page (pages longues : héros, grilles) ---------- */
export function TopFloat() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 620)
    fn()
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <button
      type="button"
      className={`top-float ${show ? 'show' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Revenir en haut de la page"
      title="Revenir en haut"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
    </button>
  )
}

/* ---------- Partage d'un lien — 3 niveaux de repli, retour toujours visible ----------
   1. Web Share API (natif sur téléphone)  2. presse-papiers moderne
   3. ancienne méthode execCommand — en dernier recours, message explicite. */
export async function shareLink(title: string, text: string, toast: (msg: string, kind?: 'ok' | 'bad' | 'info') => void) {
  if (typeof window === 'undefined') return
  const url = window.location.href
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
    } catch {
      /* partage annulé par l'utilisateur : on n'affiche rien */
    }
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    toast('Lien copié — collez-le où vous voulez !', 'ok')
    return
  } catch {}
  try {
    const ta = document.createElement('textarea')
    ta.value = url
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    toast('Lien copié — collez-le où vous voulez !', 'ok')
  } catch {
    toast("Impossible de copier automatiquement — copiez le lien depuis la barre d'adresse.", 'info')
  }
}

export function Footer() {
  const navigate = useApp((s) => s.navigate)
  const go = (t: string) => navigate(t)
  return (
    <footer className="app-footer">
      <div className="section" style={{ paddingBottom: 0 }}>
        <div className="foot-grid">
          <div className="foot-brand">
            <span className="brand" style={{ marginBottom: 16 }}>
              <img className="brand-logo" src="/ocd/logo-ocd.png" alt="OCD Live & Shop — L'Opportunité C'est Dehors" style={{ height: 38 }} />
              <span className="b-live" style={{ marginLeft: 6, transform: 'rotate(2deg)' }}>SHOP</span>
            </span>
            <p>
              « L&apos;Opportunité C&apos;est Dehors. » La plateforme commerciale africaine imaginée par Bovann,
              organisée par House of Challenge et BOVANN GROUP à Lomé (Togo), validée par la régie OCD Bovann.
              Vos lives, vos boutiques, vos produits — en direct et à toute heure.
            </p>
          </div>
          <div className="foot-links">
            <h4>Navigation</h4>
            <button onClick={() => go('/')}>Accueil</button>
            <button onClick={() => go('/live')}>OCD Live</button>
            <button onClick={() => go('/shop')}>OCD Shop</button>
            <button onClick={() => go('/soumettre')}>Soumettre un live</button>
            <button onClick={() => go('/abonnement')}>Abonnement 5 000 FCFA/mois</button>
            <button onClick={() => go('/connexion')}>Connexion vendeur</button>
          </div>
          <div className="foot-contact">
            <h4>Contact régie</h4>
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.35-.53.05-1.02.24-3.44-.72-2.92-1.15-4.76-4.2-4.9-4.4-.15-.2-1.17-1.56-1.17-2.97 0-1.41.73-2.1 1-2.39.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.56.8 1.95.87 2.09.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.3 2.33 1.44.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.19-.29.39-.24.65-.15.27.1 1.66.78 1.94.92.29.15.48.22.55.34.07.12.07.7-.17 1.38z"/></svg>
              WhatsApp régie : +49 176 584 43070
            </p>
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              contact@ocdlive.com
            </p>
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              TikTok : Bovann · House of Challenge
            </p>
            <p style={{ marginTop: 10 }}>
              Catégories OCD : {CATEGORIES.slice(0, 4).map((c) => c.label.split(' &')[0]).join(' · ')}…
            </p>
          </div>
        </div>
        <div className="foot-bottom">
          <p>© 2026 OCD — Bovann · House of Challenge · BOVANN GROUP, Lomé (Togo). Tous droits réservés.</p>
          <p>
            <button onClick={() => go('/regie')}>Espace régie</button>
          </p>
        </div>
      </div>
    </footer>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  if (toasts.length === 0) return null
  return (
    <div style={{ position: 'fixed', bottom: 84, right: 18, zIndex: 160, display: 'grid', gap: 10, maxWidth: 'min(360px, 90vw)' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => dismissToast(t.id)}
          className="badge"
          style={{
            background: 'var(--card)',
            border: `1.5px solid var(--${t.kind === 'ok' ? 'ok' : t.kind === 'bad' ? 'bad' : 'soft-line'})`,
            color: `var(--${t.kind === 'ok' ? 'ok' : t.kind === 'bad' ? 'bad' : 'accent-text'})`,
            padding: '13px 18px',
            fontSize: '0.88rem',
            fontWeight: 700,
            letterSpacing: 0,
            textTransform: 'none',
            cursor: 'pointer',
            boxShadow: '0 14px 40px rgba(0,0,0,.22)',
            borderRadius: 14,
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}

export function LoadingCards({ n = 4, h = 220 }: { n?: number; h?: number }) {
  return (
    <div className="live-grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: h }} />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  sub,
  action,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="ic" aria-hidden="true">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
      {action}
    </div>
  )
}
