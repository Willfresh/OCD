'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useApp, api } from './store'
import { Flag } from './Flag'
import { CatIcon, PlatformIcon } from './icons'
import { OcdDatePicker } from './datepicker'
import {
  CATEGORIES,
  COUNTRIES,
  COUNTRY_MAP,
  LIVE_PLATFORMS,
  LIVE_PLATFORM_MAP,
  SLOTS,
  SUBSCRIPTION_PRICE,
} from '@/lib/ocd/constants'

const STEPS = ['Mode', 'Créneau', 'Pays', 'Commerce', 'Lien', 'Envoi']

// Jour ISO (yyyy-mm-dd) en date locale, décalé d'un nombre de jours donné
const pad = (n: number) => String(n).padStart(2, '0')
function isoDay(offset: number) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Libellé lisible du jour choisi (raccourcis aujourd'hui / demain, sinon date complète)
function fmtDay(iso: string) {
  if (iso === isoDay(0)) return "aujourd'hui"
  if (iso === isoDay(1)) return 'demain'
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso + 'T12:00:00'))
}

export function SubmitView() {
  const { route, navigate, user, shop, subscription, refreshUser, toast } = useApp()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    mode: '',
    slot: '',
    date: '',
    country: '',
    city: '',
    category: '',
    displayName: '',
    platform: 'tiktok',
    liveUrl: '',
    product: '',
    phone: '',
    shopLinked: true,
  })
  const [err, setErr] = useState('')
  const [sending, setSending] = useState(false)
  const [payment, setPayment] = useState<{ method: 'momo' | 'card'; provider: string; phone: string; card: string } | null>(null)
  const [done, setDone] = useState<{ id: string; paid: boolean } | null>(null)

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        country: f.country || user.country || '',
        city: f.city || user.city || '',
        displayName: f.displayName || (shop?.name ?? ''),
        phone: f.phone || user.phone || '',
      }))
    }
  }, [user, shop])

  // Pré-sélection via l'URL (hero : présentiel / à distance) — conservé du site d'origine
  useEffect(() => {
    const m = route.query.get('mode')
    if (m === 'presentiel' || m === 'distance') setForm((f) => ({ ...f, mode: m }))
  }, [route])

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const momoProviders = useMemo(() => {
    const c = COUNTRY_MAP[form.country]
    return c?.momo ?? ['T-Money', 'Flooz', 'MTN MoMo', 'Orange Money']
  }, [form.country])

  const next = () => {
    setErr('')
    if (step === 1 && !form.mode) return setErr('Choisissez le format de votre live.')
    if (step === 2 && !form.slot) return setErr('Choisissez votre créneau.')
    if (step === 2 && !form.date) return setErr('Choisissez le jour de votre live dans le calendrier.')
    if (step === 3 && !form.country) return setErr('Choisissez votre pays.')
    if (step === 4 && (form.displayName.trim().length < 2 || !form.category)) {
      return setErr('Indiquez votre nom ou celui de votre commerce, et choisissez une catégorie.')
    }
    if (step === 5) {
      if (form.mode === 'distance') {
        if (!/^https?:\/\//i.test(form.liveUrl)) return setErr('Ajoutez le lien de votre live (il commence par https://).')
        try {
          const host = new URL(form.liveUrl).hostname.toLowerCase()
          const known = LIVE_PLATFORM_MAP[form.platform]?.hosts.some((h) => host === h || host.endsWith('.' + h))
          if (!known) return setErr(`Ce lien ne semble pas venir de ${LIVE_PLATFORM_MAP[form.platform]?.label}. Copiez le lien exact de votre live.`)
        } catch {
          return setErr('Lien invalide.')
        }
      } else if (form.product.trim().length < 2) {
        return setErr('Indiquez ce que vous présenterez en présentiel.')
      }
    }
    setStep((s) => Math.min(6, s + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const back = () => setStep((s) => Math.max(1, s - 1))
  const goto = (n: number) => {
    if (n < step) setStep(n)
  }

  const submitLive = async (paid: boolean) => {
    setSending(true)
    setErr('')
    try {
      // Paiement de l'abonnement si nécessaire (simulation clairement identifiée)
      let paidNow = false
      if (!subscription && paid) {
        if (!payment) throw new Error('Choisissez votre moyen de paiement.')
        const res = await api<{ simulated: boolean }>('/api/subscription', {
          method: 'POST',
          body: {
            method: payment.method,
            provider: payment.provider,
            phone: payment.phone,
            card: payment.card,
          },
        })
        paidNow = res.simulated
        await refreshUser()
      }
      const d = await api<{ live: { id: string } }>('/api/lives', {
        method: 'POST',
        body: {
          displayName: form.displayName.trim(),
          country: form.country,
          category: form.category,
          slot: form.slot,
          mode: form.mode,
          platform: form.mode === 'presentiel' ? 'tiktok' : form.platform,
          liveUrl: form.mode === 'presentiel' ? '' : form.liveUrl.trim(),
          scheduledDate: form.date,
          shopId: shop && form.shopLinked ? shop.id : '',
        },
      })
      setDone({ id: d.live.id, paid: paidNow || !!subscription })
      toast('Live soumis ! La régie OCD Bovann va le vérifier.', 'ok')
    } catch (ex) {
      const msg = (ex as Error).message
      if (msg.includes('ABONNEMENT_REQUIS')) {
        setErr("Un abonnement actif (5 000 FCFA/mois) est nécessaire pour soumettre un live. Choisissez votre paiement ci-dessous.")
        setStep(6)
      } else {
        setErr(msg)
      }
    } finally {
      setSending(false)
    }
  }

  // ---------- Garde : connexion requise ----------
  if (!user) {
    return (
      <main className="wizard-wrap">
        <p className="eyebrow">Soumettre mon live</p>
        <h1 className="sec-title" style={{ fontSize: 'clamp(1.7rem,3.6vw,2.3rem)' }}>D&apos;abord, connectez-vous</h1>
        <p className="sec-sub">Un compte vendeur gratuit suffit. Vous pourrez ensuite soumettre autant de lives que votre abonnement le permet.</p>
        <div className="m-actions" style={{ marginTop: 22 }}>
          <button className="btn btn-primary" onClick={() => navigate('/connexion?retour=/soumettre')}>Se connecter / S&apos;inscrire</button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
        </div>
      </main>
    )
  }

  // ---------- Confirmation ----------
  if (done) {
    return (
      <main className="wizard-wrap">
        <div className="rz-final">
          <div className="final-check">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 900 }}>Live soumis à la régie&nbsp;!</h2>
          <p className="final-sub" style={{ margin: '8px auto 0' }}>
            L&apos;équipe OCD Bovann va ouvrir votre lien et vérifier que vous êtes bien en train de vendre.
            Réponse dans votre espace vendeur.
          </p>
          <p className="final-ref"><strong>OCD-{done.id.slice(-6).toUpperCase()}</strong></p>
          {done.paid && (
            <p className="info-note" style={{ maxWidth: 420, margin: '0 auto 18px' }}>
              Paiement de l&apos;abonnement enregistré (simulation — aucun débit réel).
            </p>
          )}
          <div className="final-actions">
            <button className="btn btn-primary" onClick={() => navigate('/espace-vendeur')}>Suivre dans mon espace</button>
            <button className="btn btn-ghost" onClick={() => navigate('/live')}>Voir OCD Live</button>
          </div>
        </div>
      </main>
    )
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <main className="wizard-wrap">
      <p className="eyebrow">Soumettre mon live — assistant</p>
      <h1 className="resa-title" style={{ fontSize: 'clamp(1.7rem,3.6vw,2.45rem)', fontWeight: 900, letterSpacing: '-0.03em', marginTop: 12 }}>
        Réservez votre visibilité, étape par étape
      </h1>
      <p className="sec-sub" style={{ marginTop: 10 }}>
        Mode, créneau, pays, commerce, lien puis envoi — chaque étape validée ouvre la suivante.
      </p>

      <ol className="stepper" style={{ ['--prog' as string]: `${progress}%` }} aria-label="Progression">
        {STEPS.map((lbl, i) => (
          <li key={lbl} className={`st ${step === i + 1 ? 'cur' : step > i + 1 ? 'done' : ''}`}>
            <button type="button" className="st-dot" style={{ background: 'var(--card)', border: '2px solid ' + (step > i + 1 ? 'var(--orange)' : 'var(--line)'), width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: step > i + 1 ? 'pointer' : 'default', fontWeight: 900 }} onClick={() => goto(i + 1)} aria-label={`Étape ${i + 1} : ${lbl}`}>
              {step > i + 1 ? '✓' : i + 1}
            </button>
            <span className="st-lbl">{lbl}</span>
          </li>
        ))}
      </ol>

      <div className="recap" aria-live="polite">
        {form.mode && (
          <span className="chip"><span className="ck" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />{form.mode === 'presentiel' ? 'En présentiel' : 'À distance'}</span>
        )}
        {form.slot && (
          <span className="chip">
            {form.slot === 'MATIN' ? 'Matin 08h–11h' : 'Soir 18h–21h'}
            {form.date ? ` · ${fmtDay(form.date)}` : ''}
          </span>
        )}
        {form.country && <span className="chip">{COUNTRY_MAP[form.country]?.name}</span>}
        {form.category && <span className="chip">{CATEGORIES.find((c) => c.id === form.category)?.label}</span>}
        {form.displayName && <span className="chip">{form.displayName}</span>}
      </div>

      {/* ---------- Étape 1 : mode ---------- */}
      <section className={`rz-step ${step === 1 ? 'on' : ''}`}>
        <h2 className="step-title">Dans quel format voulez-vous passer en direct&nbsp;?</h2>
        <p className="step-hint">Deux formats, la même antenne — et la même validation par la régie.</p>
        <div className="mode-cards">
          <button type="button" className={`mode-card ${form.mode === 'presentiel' ? 'sel' : ''}`} onClick={() => set('mode', 'presentiel')}>
            <span className="mc-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg></span>
            <span><strong>Live en présentiel</strong><small>À la régie OCD Bovann — l&apos;équipe diffuse sur le compte OCD, pas de lien à fournir</small></span>
            <span className="mc-check">✓</span>
          </button>
          <button type="button" className={`mode-card ${form.mode === 'distance' ? 'sel' : ''}`} onClick={() => set('mode', 'distance')}>
            <span className="mc-ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>
            <span><strong>Live à distance</strong><small>Depuis votre téléphone : votre live TikTok / YouTube / Facebook, votre lien suffit</small></span>
            <span className="mc-check">✓</span>
          </button>
        </div>
      </section>

      {/* ---------- Étape 2 : créneau ---------- */}
      <section className={`rz-step ${step === 2 ? 'on' : ''}`}>
        <h2 className="step-title">Choisissez votre créneau</h2>
        <p className="step-hint">Deux créneaux commerciaux par jour — l&apos;heure est celle de votre pays. Réservez la date de votre choix dans le calendrier, jusqu&apos;à deux mois à l&apos;avance.</p>
        <div className="slot-cards">
          {SLOTS.map((s) => (
            <button key={s.id} type="button" className={`slot-card ${form.slot === s.id ? 'sel' : ''}`} onClick={() => set('slot', s.id)}>
              <span className="sl-hours">{s.id === 'MATIN' ? '08h – 11h' : '18h – 21h'}</span>
              <strong>{s.label}</strong>
              <small>{s.id === 'MATIN' ? "Le créneau du petit-déjeuner et du déjeuner : nourriture, alimentaire, services." : "Le créneau du soir : mode, beauté, électronique, tout commerce."}</small>
              <span className="mc-check" style={{ position: 'absolute', top: 12, right: 12, width: 25, height: 25, borderRadius: '50%', background: 'var(--orange)', color: '#0A0908', display: form.slot === s.id ? 'grid' : 'none', placeItems: 'center' }}>✓</span>
            </button>
          ))}
        </div>
        <div className="pills" style={{ marginTop: 16 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted-ink)', alignSelf: 'center' }}>Jour&nbsp;:</span>
          <button type="button" className={`pill ${form.date === isoDay(0) ? 'sel' : ''}`} onClick={() => set('date', isoDay(0))}>Aujourd&apos;hui</button>
          <button type="button" className={`pill ${form.date === isoDay(1) ? 'sel' : ''}`} onClick={() => set('date', isoDay(1))}>Demain</button>
          {form.date && form.date !== isoDay(0) && form.date !== isoDay(1) && (
            <button type="button" className="pill sel" title="Choisir un autre jour" onClick={() => set('date', '')}>{fmtDay(form.date)}</button>
          )}
        </div>
        <OcdDatePicker value={form.date} onChange={(iso) => set('date', iso)} maxDays={60} />
      </section>

      {/* ---------- Étape 3 : pays ---------- */}
      <section className={`rz-step ${step === 3 ? 'on' : ''}`}>
        <h2 className="step-title">Votre pays et votre ville</h2>
        <p className="step-hint">Votre fiche apparaîtra dans la navigation par pays d&apos;OCD Live.</p>
        <div className="fgrid">
          <div className="field f-full">
            <label htmlFor="f-country">Pays <b>*</b></label>
            <select id="f-country" value={form.country} onChange={(e) => set('country', e.target.value)}>
              <option value="">— Choisir votre pays —</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} — {c.momo.join(' / ')}</option>
              ))}
            </select>
            <p className="ferr">Choisissez votre pays.</p>
          </div>
          <div className="field f-full">
            <label htmlFor="f-city">Ville <small>(facultatif)</small></label>
            <input id="f-city" type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Ex. Cotonou, Lomé, Douala…" />
            <p className="ferr" />
          </div>
        </div>
        {form.country && (
          <p className="info-note" style={{ marginTop: 14 }}>
            <Flag code={form.country} size={16} /> Fuseau : {COUNTRY_MAP[form.country]?.tz.replace('Africa/', '').replace('_', ' ')} — les créneaux 08h–11h et 18h–21h sont calculés sur l&apos;heure locale.
          </p>
        )}
      </section>

      {/* ---------- Étape 4 : commerce ---------- */}
      <section className={`rz-step ${step === 4 ? 'on' : ''}`}>
        <h2 className="step-title">Votre commerce</h2>
        <p className="step-hint">Nom affiché sur votre fiche et catégorie de vos produits.</p>
        <div className="fgrid">
          <div className="field f-full">
            <label htmlFor="f-display">Nom (vous ou votre commerce) <b>*</b></label>
            <input id="f-display" type="text" value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="Ex. Chez Maman Awa — Cuisine béninoise" />
            <p className="ferr">Nom requis.</p>
          </div>
        </div>
        <p style={{ fontWeight: 800, fontSize: '0.84rem', margin: '16px 0 10px' }}>Catégorie <b style={{ color: 'var(--accent-strong)' }}>*</b></p>
        <div className="cat-chips">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={`cat-chip ${form.category === c.id ? 'sel' : ''}`} onClick={() => set('category', c.id)}>
              <CatIcon id={c.icon} size={15} />
              {c.label}
            </button>
          ))}
        </div>
        {shop && (
          <p className="info-note" style={{ marginTop: 16 }}>
            Votre boutique <strong>{shop.name}</strong> sera reliée à ce live : les spectateurs pourront voir vos produits
            depuis votre fiche.{' '}
            <button style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 800, cursor: 'pointer', color: 'var(--accent-text)', textDecoration: 'underline' }} onClick={() => set('shopLinked', !form.shopLinked)}>
              {form.shopLinked ? 'Ne pas associer' : 'Associer ma boutique'}
            </button>
          </p>
        )}
      </section>

      {/* ---------- Étape 5 : lien du live ---------- */}
      <section className={`rz-step ${step === 5 ? 'on' : ''}`}>
        {form.mode === 'distance' ? (
          <>
            <h2 className="step-title">Le lien de votre live</h2>
            <p className="step-hint">Lancez d&apos;abord votre live sur la plateforme, puis copiez son lien ici.</p>
            <p style={{ fontWeight: 800, fontSize: '0.84rem', margin: '0 0 10px' }}>Plateforme <b style={{ color: 'var(--accent-strong)' }}>*</b></p>
            <div className="pills" style={{ marginBottom: 16 }}>
              {LIVE_PLATFORMS.map((p) => (
                <button key={p.id} type="button" className={`pill ${form.platform === p.id ? 'sel' : ''}`} onClick={() => set('platform', p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <PlatformIcon platform={p.id} size={15} />
                  {p.label}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="f-url">Lien du live <b>*</b></label>
              <input id="f-url" type="url" inputMode="url" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} placeholder={LIVE_PLATFORM_MAP[form.platform]?.urlHint} />
              <p className="ferr">Lien invalide — il doit venir de {LIVE_PLATFORM_MAP[form.platform]?.label}.</p>
            </div>
            <p className="m-note" style={{ marginTop: 16 }}>
              Sur TikTok : ouvrez votre live → Partager → Copier le lien. Le lien ressemble à{' '}
              <code>https://www.tiktok.com/@votrenom/live</code>.
            </p>
          </>
        ) : (
          <>
            <h2 className="step-title">Ce que vous présenterez en présentiel</h2>
            <p className="step-hint">La régie OCD Bovann prépare votre passage à l&apos;antenne — dites-nous ce vous vendez.</p>
            <div className="field">
              <label htmlFor="f-product">Produit ou activité à présenter <b>*</b></label>
              <input id="f-product" type="text" value={form.product} onChange={(e) => set('product', e.target.value)} placeholder="Ex. savons artisanaux, plats du jour, pagnes…" />
              <p className="ferr">Indiquez votre produit.</p>
            </div>
          </>
        )}
      </section>

      {/* ---------- Étape 6 : envoi (+ paiement si abonnement expiré) ---------- */}
      <section className={`rz-step ${step === 6 ? 'on' : ''}`}>
        <h2 className="step-title">Vérifiez et envoyez</h2>
        <p className="step-hint">La régie vérifie chaque live avant publication — réponse dans votre espace vendeur.</p>

        {!subscription ? (
          <div className="pay-summary" style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-ink)', margin: '0 0 12px' }}>Abonnement requis</h3>
            <div className="sum-rows">
              <div className="sum-row"><span>Formule</span><b>OCD Live — 1 mois</b></div>
              <div className="sum-row"><span>Créneaux inclus</span><b>Matin 08h–11h + Soir 18h–21h</b></div>
              <div className="sum-total"><span>Total</span><strong>5 000 FCFA</strong></div>
            </div>
            <div className="pm-list" style={{ marginTop: 16 }}>
              <button
                type="button"
                className={`pm ${payment?.method === 'momo' ? 'sel' : ''}`}
                onClick={() => setPayment({ method: 'momo', provider: momoProviders[0], phone: '', card: '' })}
              >
                <span className="pm-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
                <span className="pm-txt"><strong>Mobile Money</strong><small>Opérateurs de {COUNTRY_MAP[form.country]?.name ?? 'votre pays'}</small></span>
                <span className="pm-check">✓</span>
              </button>
              <button
                type="button"
                className={`pm ${payment?.method === 'card' ? 'sel' : ''}`}
                onClick={() => setPayment({ method: 'card', provider: 'Carte bancaire', phone: '', card: '' })}
              >
                <span className="pm-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
                <span className="pm-txt"><strong>Carte bancaire</strong><small>Visa · Mastercard</small></span>
                <span className="pm-check">✓</span>
              </button>
            </div>
            {payment?.method === 'momo' && (
              <div style={{ marginTop: 14 }}>
                <div className="pills" style={{ marginBottom: 10 }}>
                  {momoProviders.map((m) => (
                    <button key={m} type="button" className={`pill ${payment.provider === m ? 'sel' : ''}`} onClick={() => setPayment({ ...payment, provider: m })}>{m}</button>
                  ))}
                </div>
                <div className="field">
                  <label htmlFor="f-momo">Numéro {payment.provider}</label>
                  <input id="f-momo" type="tel" value={payment.phone} onChange={(e) => setPayment({ ...payment, phone: e.target.value })} placeholder="Ex. +228 90 12 34 56" />
                  <p className="ferr" />
                </div>
              </div>
            )}
            {payment?.method === 'card' && (
              <div style={{ marginTop: 14 }}>
                <div className="field">
                  <label htmlFor="f-card">Numéro de carte</label>
                  <input id="f-card" type="text" inputMode="numeric" value={payment.card} onChange={(e) => setPayment({ ...payment, card: e.target.value })} placeholder="4242 4242 4242 4242" />
                  <p className="ferr" />
                </div>
              </div>
            )}
            <p className="sum-note" style={{ marginTop: 12 }}>
              Paiement <strong>simulé</strong> en mode démonstration : aucun débit réel. Un prestataire Mobile Money
              (CinetPay, PayDunya…) sera branché en production.
            </p>
          </div>
        ) : (
          <p className="info-note" style={{ marginBottom: 18 }}>
            Abonnement actif — vous pouvez soumettre ce live sans paiement supplémentaire.
          </p>
        )}

        <div className="fgrid">
          <div className="field">
            <label htmlFor="f-phone">Numéro WhatsApp <b>*</b></label>
            <input id="f-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="La régie peut vous appeler" />
            <p className="ferr" />
          </div>
        </div>

        {err && <p className="error-note" style={{ marginTop: 12 }}>{err}</p>}
      </section>

      <div className="wiz-nav">
        <button className="btn btn-ghost" type="button" onClick={back} disabled={step === 1}>← Retour</button>
        {step < 6 ? (
          <button className="btn btn-primary" type="button" onClick={next} style={{ minWidth: 200 }}>Continuer →</button>
        ) : (
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => submitLive(true)}
            disabled={sending || (!subscription && !payment)}
            style={{ minWidth: 260 }}
          >
            {sending && <span className="spinner" />}
            {subscription ? 'Envoyer à la régie' : `Payer ${SUBSCRIPTION_PRICE.toLocaleString('fr-FR')} FCFA et soumettre`}
          </button>
        )}
      </div>
    </main>
  )
}
