'use client'

import React, { useState } from 'react'
import { useApp, api } from './store'
import { COUNTRIES } from '@/lib/ocd/constants'

export function AuthView() {
  const { navigate, refreshUser, toast } = useApp()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    city: '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (tab === 'login') {
      if (!form.email || !form.password) return setErr('E-mail et mot de passe requis.')
    } else {
      if (form.name.trim().length < 2) return setErr('Indiquez votre nom complet.')
      if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErr('E-mail invalide.')
      if (form.password.length < 6) return setErr('Mot de passe : 6 caractères minimum.')
    }
    setBusy(true)
    try {
      if (tab === 'login') {
        await api('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } })
      } else {
        await api('/api/auth/register', {
          method: 'POST',
          body: {
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone,
            country: form.country,
            city: form.city,
          },
        })
      }
      await refreshUser()
      toast(tab === 'login' ? 'Content de vous revoir !' : 'Compte vendeur créé — bienvenue sur OCD !', 'ok')
      navigate(form.email === 'regie@ocd.live' ? '/regie' : '/espace-vendeur')
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const fillDemo = (kind: 'admin' | 'vendor') => {
    setTab('login')
    if (kind === 'admin') setForm((f) => ({ ...f, email: 'regie@ocd.live', password: 'OCD2026' }))
    else setForm((f) => ({ ...f, email: 'awa@demo.ocd', password: 'demo1234' }))
  }

  return (
    <main className="wizard-wrap" style={{ maxWidth: 640 }}>
      <p className="eyebrow">Espace vendeur — OCD</p>
      <h1 className="sec-title" style={{ fontSize: 'clamp(1.7rem,3.6vw,2.3rem)' }}>
        {tab === 'login' ? 'Connectez-vous' : 'Créez votre compte vendeur'}
      </h1>
      <p className="sec-sub">
        {tab === 'login'
          ? 'Accédez à vos lives, votre boutique, vos commandes et votre abonnement.'
          : 'Quelques informations, un mot de passe — et vous pouvez soumettre votre premier live.'}
      </p>

      <div className="dash-tabs" style={{ marginTop: 24 }}>
        <button className={`dash-tab ${tab === 'login' ? 'sel' : ''}`} onClick={() => setTab('login')}>Connexion</button>
        <button className={`dash-tab ${tab === 'register' ? 'sel' : ''}`} onClick={() => setTab('register')}>Inscription</button>
      </div>

      <form onSubmit={submit} noValidate>
        {tab === 'register' && (
          <div className="fgrid">
            <div className="field f-full">
              <label htmlFor="a-name">Nom complet <b>*</b></label>
              <input id="a-name" type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex. Awa Kodjo" autoComplete="name" />
              <p className="ferr">Nom requis.</p>
            </div>
          </div>
        )}
        <div className="fgrid" style={{ marginTop: tab === 'register' ? 0 : 12 }}>
          <div className="field f-full">
            <label htmlFor="a-email">E-mail <b>*</b></label>
            <input id="a-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
            <p className="ferr">E-mail invalide.</p>
          </div>
          <div className="field f-full">
            <label htmlFor="a-pass">Mot de passe <b>*</b></label>
            <input id="a-pass" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="6 caractères minimum" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />
            <p className="ferr">Mot de passe requis.</p>
          </div>
          {tab === 'register' && (
            <>
              <div className="field">
                <label htmlFor="a-phone">Numéro WhatsApp <small>(pour vos commandes)</small></label>
                <input id="a-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+228 90 12 34 56" autoComplete="tel" />
                <p className="ferr" />
              </div>
              <div className="field">
                <label htmlFor="a-country">Pays</label>
                <select id="a-country" value={form.country} onChange={(e) => set('country', e.target.value)}>
                  <option value="">— Choisir —</option>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="field f-full">
                <label htmlFor="a-city">Ville <small>(facultatif)</small></label>
                <input id="a-city" type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ex. Cotonou" />
                <p className="ferr" />
              </div>
            </>
          )}
        </div>
        {err && <p className="error-note" style={{ marginTop: 14 }}>{err}</p>}
        <div className="m-actions">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy && <span className="spinner" />}
            {tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => navigate('/')}>← Accueil</button>
        </div>
      </form>

      <div className="demo-banner" style={{ marginTop: 26 }}>
        <b>Comptes de démonstration</b>
        <span>à remplacer par de vrais comptes en production :</span>
        <button className="btn btn-ghost btn-sm" onClick={() => fillDemo('admin')}>Régie OCD (admin)</button>
        <button className="btn btn-ghost btn-sm" onClick={() => fillDemo('vendor')}>Vendeuse démo (boutique + abonnement)</button>
      </div>
    </main>
  )
}
