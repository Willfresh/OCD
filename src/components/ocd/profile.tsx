'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useApp, api, fmtDate, fmtDateTime, initials } from './store'
import { LoadingCards, EmptyState } from './chrome'
import { Flag } from './Flag'
import { COUNTRIES, COUNTRY_MAP } from '@/lib/ocd/constants'

/* ===================== Profil utilisateur — OCD =====================
   Avatar, informations, mot de passe, boutique & abonnement, déconnexion. */

interface ProfileForm {
  name: string
  phone: string
  country: string
  city: string
  avatarUrl: string
}

export function ProfileView() {
  const { user, shop, subscription, navigate, refreshUser, toast, logout } = useApp()
  const [form, setForm] = useState<ProfileForm>({ name: '', phone: '', country: '', city: '', avatarUrl: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Mot de passe
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr] = useState('')
  const [pwBusy, setPwBusy] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        phone: user.phone ?? '',
        country: user.country ?? '',
        city: user.city ?? '',
        avatarUrl: user.avatarUrl ?? '',
      })
    }
  }, [user])

  if (!user) {
    return (
      <main className="dash-wrap">
        <EmptyState
          title="Connectez-vous pour voir votre profil"
          sub="Votre profil regroupe vos informations, votre boutique et votre abonnement."
          action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/connexion?retour=/profil')}>Se connecter</button>}
        />
      </main>
    )
  }

  const save = async () => {
    setErr('')
    if (form.name.trim().length < 2) return setErr('Indiquez votre nom complet.')
    setBusy(true)
    try {
      await api('/api/auth/profile', { method: 'PATCH', body: form })
      await refreshUser()
      toast('Profil mis à jour !', 'ok')
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const changePassword = async () => {
    setPwErr('')
    if (!pw.current) return setPwErr('Indiquez votre mot de passe actuel.')
    if (pw.next.length < 6) return setPwErr('Nouveau mot de passe : 6 caractères minimum.')
    if (pw.next !== pw.confirm) return setPwErr('Les deux nouveaux mots de passe ne sont pas identiques.')
    setPwBusy(true)
    try {
      await api('/api/auth/profile', { method: 'POST', body: { currentPassword: pw.current, newPassword: pw.next } })
      setPw({ current: '', next: '', confirm: '' })
      toast('Mot de passe changé — vos autres sessions sont fermées.', 'ok')
    } catch (ex) {
      setPwErr((ex as Error).message)
    } finally {
      setPwBusy(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Téléversement impossible.')
      setForm((f) => ({ ...f, avatarUrl: d.url }))
      toast('Photo enregistrée — pensez à « Enregistrer ».', 'ok')
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="dash-wrap">
      <p className="eyebrow">Mon compte — OCD</p>
      <h1 className="sec-title" style={{ fontSize: 'clamp(1.6rem,3.4vw,2.3rem)' }}>Mon profil</h1>
      <p className="sec-sub">Vos informations, votre photo, votre mot de passe — et vos raccourcis vendeur.</p>

      {/* Carte d'identité */}
      <div className="profile-hero">
        <div className="ph-avatar">
          {form.avatarUrl || user.avatarUrl ? (
            <img src={form.avatarUrl || (user.avatarUrl ?? '')} alt={user.name} />
          ) : (
            <span>{initials(user.name)}</span>
          )}
          <button className="ph-cam" type="button" onClick={() => fileRef.current?.click()} aria-label="Changer ma photo" title="Changer ma photo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
          />
        </div>
        <div className="ph-txt">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <b style={{ fontSize: '1.3rem' }}>{user.name}</b>
            <span className={`badge ${user.role === 'ADMIN' ? 'badge-live-on' : 'badge-ok'}`}>
              {user.role === 'ADMIN' ? 'RÉGIE OCD' : 'VENDEUR'}
            </span>
            {user.isDemo && <span className="badge badge-demo">DÉMO</span>}
          </div>
          <p className="lc-meta" style={{ marginTop: 6 }}>
            {user.email} · membre depuis le {fmtDate(user.createdAt)}
            {user.country && <> · <Flag code={user.country} size={15} /> {COUNTRY_MAP[user.country]?.name}{user.city ? ` (${user.city})` : ''}</>}
          </p>
          {uploading && <p className="ferr" style={{ marginTop: 4 }}>Téléversement de la photo…</p>}
        </div>
      </div>

      <div className="profile-grid">
        {/* Mes informations */}
        <div className="review-card">
          <b style={{ fontSize: '1.05rem' }}>Mes informations</b>
          <p className="sec-sub" style={{ margin: '4px 0 8px', fontSize: '0.85rem' }}>
            Ces informations apparaissent à la régie et sur votre boutique.
          </p>
          <div className="fgrid">
            <div className="field f-full">
              <label htmlFor="pr-name">Nom complet <b>*</b></label>
              <input id="pr-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <p className="ferr">Nom requis.</p>
            </div>
            <div className="field">
              <label htmlFor="pr-phone">Téléphone / WhatsApp</label>
              <input id="pr-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+229 90 12 34 56" />
              <p className="ferr" />
            </div>
            <div className="field">
              <label htmlFor="pr-country">Pays</label>
              <select id="pr-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                <option value="">— Choisir —</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <p className="ferr" />
            </div>
            <div className="field f-full">
              <label htmlFor="pr-city">Ville</label>
              <input id="pr-city" type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex. Cotonou" />
              <p className="ferr" />
            </div>
          </div>
          {err && <p className="error-note" style={{ marginTop: 10 }}>{err}</p>}
          <div className="review-actions">
            <button className="btn btn-primary" onClick={save} disabled={busy || uploading}>
              {busy && <span className="spinner" />}
              Enregistrer
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          {/* Mot de passe */}
          <div className="review-card">
            <b style={{ fontSize: '1.05rem' }}>Mot de passe</b>
            <p className="sec-sub" style={{ margin: '4px 0 8px', fontSize: '0.85rem' }}>
              Après un changement, vos autres appareils seront déconnectés.
            </p>
            <div className="fgrid">
              <div className="field f-full">
                <label htmlFor="pw-cur">Mot de passe actuel <b>*</b></label>
                <input id="pw-cur" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
                <p className="ferr" />
              </div>
              <div className="field">
                <label htmlFor="pw-new">Nouveau <b>*</b></label>
                <input id="pw-new" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
                <p className="ferr">6 caractères minimum.</p>
              </div>
              <div className="field">
                <label htmlFor="pw-conf">Confirmer <b>*</b></label>
                <input id="pw-conf" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" />
                <p className="ferr" />
              </div>
            </div>
            {pwErr && <p className="error-note" style={{ marginTop: 10 }}>{pwErr}</p>}
            <div className="review-actions">
              <button className="btn btn-site" onClick={changePassword} disabled={pwBusy}>
                {pwBusy && <span className="spinner" />}
                Changer mon mot de passe
              </button>
            </div>
          </div>

          {/* Raccourcis vendeur */}
          {user.role !== 'ADMIN' && (
            <div className="review-card">
              <b style={{ fontSize: '1.05rem' }}>Ma boutique & mon abonnement</b>
              <div className="review-rows" style={{ marginTop: 8 }}>
                <span>
                  Boutique :{' '}
                  {shop ? (
                    <>
                      <b>{shop.name}</b>{' '}
                      <button
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 700, color: 'var(--accent-text)', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/boutique/${shop.slug}`)}
                      >
                        voir ma page
                      </button>
                    </>
                  ) : (
                    <>pas encore créée — <button style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 700, color: 'var(--accent-text)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/espace-vendeur')}>créer ma boutique</button></>
                  )}
                </span>
                <span>
                  Abonnement :{' '}
                  {subscription ? (
                    <>actif jusqu&apos;au <b>{fmtDateTime(subscription.endDate)}</b>{subscription.isDemo && <> · <span className="badge badge-demo">DÉMO</span></>}</>
                  ) : (
                    <b style={{ color: 'var(--bad)' }}>aucun — soumissions bloquées</b>
                  )}
                </span>
              </div>
              <div className="review-actions">
                <button className="btn btn-primary" onClick={() => navigate('/espace-vendeur')}>Mon espace vendeur</button>
                <button className="btn btn-ghost" onClick={() => navigate('/abonnement')}>Abonnement</button>
              </div>
            </div>
          )}
          {user.role === 'ADMIN' && (
            <div className="review-card">
              <b style={{ fontSize: '1.05rem' }}>Régie OCD Bovann</b>
              <div className="review-rows" style={{ marginTop: 8 }}>
                <span>Vous gérez les validations, boutiques, produits et paiements de la plateforme.</span>
              </div>
              <div className="review-actions">
                <button className="btn btn-primary" onClick={() => navigate('/regie')}>Ouvrir l&apos;espace régie</button>
              </div>
            </div>
          )}

          {/* Déconnexion */}
          <div className="review-card" style={{ borderColor: 'rgba(226,61,61,0.35)' }}>
            <b style={{ fontSize: '1.05rem' }}>Déconnexion</b>
            <p className="sec-sub" style={{ margin: '4px 0 10px', fontSize: '0.85rem' }}>
              Vous fermez votre session sur cet appareil. Vos données restent enregistrées.
            </p>
            <div className="review-actions">
              <button className="btn btn-ghost" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => logout()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
