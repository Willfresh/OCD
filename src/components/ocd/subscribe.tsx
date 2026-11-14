'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useApp, api, fmtPrice, fmtDateTime } from './store'
import { Flag } from './Flag'
import { COUNTRIES, COUNTRY_MAP, SUBSCRIPTION_PRICE } from '@/lib/ocd/constants'

interface SubData {
  active: { endDate: string; startDate: string; amount: number; isDemo: boolean } | null
  history: { startDate: string; endDate: string; status: string; amount: number; isDemo: boolean }[]
  payments: { reference: string; amount: number; method: string; provider: string | null; status: string; createdAt: string }[]
  price: number
}

export function SubscribeView() {
  const { user, navigate, refreshUser, toast } = useApp()
  const [data, setData] = useState<SubData | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [pay, setPay] = useState<{ method: 'momo' | 'card'; provider: string; phone: string; card: string }>({
    method: 'momo',
    provider: '',
    phone: '',
    card: '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ reference: string; endDate: string } | null>(null)

  const country = user?.country ?? ''
  const momoProviders = useMemo(() => COUNTRY_MAP[country]?.momo ?? ['T-Money', 'Flooz', 'MTN MoMo', 'Orange Money', 'Wave'], [country])

  const load = () => {
    if (!user) return
    api<SubData>('/api/subscription')
      .then((d) => setData(d))
      .catch(() => {})
  }
  useEffect(load, [user])

  useEffect(() => {
    if (payOpen && !pay.provider && momoProviders[0]) setPay((p) => ({ ...p, provider: momoProviders[0] }))
  }, [payOpen, momoProviders, pay.provider])

  if (!user) {
    return (
      <main className="wizard-wrap" style={{ maxWidth: 720 }}>
        <p className="eyebrow">Abonnement OCD Live</p>
        <h1 className="sec-title" style={{ fontSize: 'clamp(1.7rem,3.6vw,2.3rem)' }}>5 000 FCFA par mois</h1>
        <p className="sec-sub">Créez votre compte vendeur pour souscrire, payer et suivre votre abonnement.</p>
        <div className="m-actions" style={{ marginTop: 22 }}>
          <button className="btn btn-primary" onClick={() => navigate('/connexion?retour=/abonnement')}>Se connecter / S&apos;inscrire</button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>← Accueil</button>
        </div>
      </main>
    )
  }

  const doPay = async () => {
    setErr('')
    if (pay.method === 'momo' && pay.phone.replace(/\D/g, '').length < 8) return setErr('Numéro Mobile Money invalide.')
    if (pay.method === 'card' && pay.card.replace(/\D/g, '').length < 12) return setErr('Numéro de carte invalide.')
    setBusy(true)
    try {
      const d = await api<{ payment: { reference: string }; subscription: { endDate: string } }>('/api/subscription', {
        method: 'POST',
        body: { method: pay.method, provider: pay.provider, phone: pay.phone, card: pay.card },
      })
      setDone({ reference: d.payment.reference, endDate: d.subscription.endDate })
      setPayOpen(false)
      await refreshUser()
      load()
      toast('Abonnement activé (paiement simulé) !', 'ok')
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const daysLeft = data?.active
    ? Math.max(0, Math.ceil((new Date(data.active.endDate).getTime() - Date.now()) / 86400000))
    : 0

  return (
    <main className="wizard-wrap" style={{ maxWidth: 820 }}>
      <p className="eyebrow">Abonnement OCD Live — vendeur</p>
      <h1 className="sec-title" style={{ fontSize: 'clamp(1.8rem,3.8vw,2.5rem)' }}>
        La visibilité, tous les jours
      </h1>
      <p className="sec-sub">
        Payez {fmtPrice(SUBSCRIPTION_PRICE, 'XOF')} par mois et soumettez vos lives sur les deux créneaux quotidiens,
        sous réserve de validation par la régie.
      </p>

      {/* Statut */}
      <div className="pay-summary" style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-ink)', margin: '0 0 14px' }}>
          Mon abonnement
        </h3>
        {data === null ? (
          <div className="skeleton" style={{ height: 84 }} />
        ) : data.active ? (
          <>
            <div className="sum-rows">
              <div className="sum-row"><span>Statut</span><b style={{ color: 'var(--ok)' }}>ACTIF</b></div>
              <div className="sum-row"><span>Valable jusqu&apos;au</span><b>{fmtDateTime(data.active.endDate)}</b></div>
              <div className="sum-row"><span>Jours restants</span><b>{daysLeft} jours</b></div>
            </div>
            <div className="m-actions" style={{ marginTop: 16, paddingTop: 0 }}>
              <button className="btn btn-primary" onClick={() => { setDone(null); setPayOpen(true) }}>Renouveler +1 mois</button>
            </div>
          </>
        ) : (
          <>
            <div className="sum-rows">
              <div className="sum-row"><span>Statut</span><b style={{ color: 'var(--bad)' }}>AUCUN ABONNEMENT ACTIF</b></div>
              <div className="sum-row"><span>Sans abonnement</span><b>vous ne pouvez pas soumettre de lives</b></div>
            </div>
            <div className="m-actions" style={{ marginTop: 16, paddingTop: 0 }}>
              <button className="btn btn-primary" onClick={() => { setDone(null); setPayOpen(true) }}>M&apos;abonner — {fmtPrice(SUBSCRIPTION_PRICE, 'XOF')}</button>
            </div>
          </>
        )}
      </div>

      {done && (
        <p className="info-note" style={{ marginTop: 16 }}>
          Paiement <strong>{done.reference}</strong> enregistré — abonnement actif jusqu&apos;au {fmtDateTime(done.endDate)}.
          Rappel : paiement <strong>simulé</strong> en démonstration, aucun débit réel.
        </p>
      )}

      {/* Historique */}
      <h2 style={{ marginTop: 36, fontSize: '1.25rem', fontWeight: 900 }}>Historique des paiements</h2>
      {data && data.payments.length > 0 ? (
        <div className="table-scroll" style={{ marginTop: 14 }}>
          <table className="data-table">
            <thead>
              <tr><th>Référence</th><th>Date</th><th>Moyen</th><th>Montant</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr key={p.reference}>
                  <td><b>{p.reference}</b></td>
                  <td>{fmtDateTime(p.createdAt)}</td>
                  <td>{p.provider ?? p.method}</td>
                  <td><b>{fmtPrice(p.amount, 'XOF')}</b></td>
                  <td><span className="badge badge-ok">{p.status === 'SUCCESS' ? 'Réglé' : p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="sec-sub" style={{ marginTop: 12 }}>Aucun paiement enregistré pour l&apos;instant.</p>
      )}

      {/* Ce que comprend l'abonnement */}
      <h2 style={{ marginTop: 36, fontSize: '1.25rem', fontWeight: 900 }}>Ce que comprend l&apos;abonnement</h2>
      <div className="steps-grid" style={{ marginTop: 20, gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))' }}>
        <article className="step" style={{ padding: 20 }}>
          <span className="ic">☀️</span>
          <h3 style={{ fontSize: '1rem' }}>Créneau du matin</h3>
          <p style={{ fontSize: '0.88rem' }}>08h–11h, heure de votre pays — idéal nourriture et services.</p>
        </article>
        <article className="step" style={{ padding: 20 }}>
          <span className="ic">🌙</span>
          <h3 style={{ fontSize: '1rem' }}>Créneau du soir</h3>
          <p style={{ fontSize: '0.88rem' }}>18h–21h, heure de votre pays — mode, beauté, électronique.</p>
        </article>
        <article className="step" style={{ padding: 20 }}>
          <span className="ic">🛍️</span>
          <h3 style={{ fontSize: '1rem' }}>Boutique reliée</h3>
          <p style={{ fontSize: '0.88rem' }}>Votre boutique OCD Shop accessible depuis chaque fiche live.</p>
        </article>
        <article className="step" style={{ padding: 20 }}>
          <span className="ic">📱</span>
          <h3 style={{ fontSize: '1rem' }}>Paiement local</h3>
          <p style={{ fontSize: '0.88rem' }}>Mobile Money selon votre pays : {momoProviders.join(', ')}.</p>
        </article>
      </div>

      {/* Modal de paiement */}
      {payOpen && (
        <div className="modal open" role="dialog" aria-modal="true" aria-label="Paiement de l'abonnement">
          <div className="modal-overlay" onClick={() => setPayOpen(false)} />
          <div className="modal-panel">
            <button className="modal-close" onClick={() => setPayOpen(false)} aria-label="Fermer">✕</button>
            <p className="m-mode"><span className="pulse-dot" />Abonnement OCD Live — 1 mois</p>
            <h3 className="m-title">Payer {fmtPrice(SUBSCRIPTION_PRICE, 'XOF')}</h3>
            <p className="m-pkg">Le tarif est en FCFA. Selon votre pays, le montant est converti par votre opérateur Mobile Money.</p>
            {country && (
              <p className="m-pkg" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flag code={country} size={16} /> {COUNTRY_MAP[country]?.name} — opérateurs disponibles : {momoProviders.join(', ')}
              </p>
            )}
            <div className="pm-list">
              <button type="button" className={`pm ${pay.method === 'momo' ? 'sel' : ''}`} onClick={() => setPay({ ...pay, method: 'momo', provider: momoProviders[0] })}>
                <span className="pm-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
                <span className="pm-txt"><strong>Mobile Money</strong><small>{momoProviders.join(' · ')}</small></span>
                <span className="pm-check">✓</span>
              </button>
              <button type="button" className={`pm ${pay.method === 'card' ? 'sel' : ''}`} onClick={() => setPay({ ...pay, method: 'card', provider: 'Carte bancaire' })}>
                <span className="pm-ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
                <span className="pm-txt"><strong>Carte bancaire</strong><small>Visa · Mastercard</small></span>
                <span className="pm-check">✓</span>
              </button>
            </div>
            {pay.method === 'momo' && (
              <>
                <div className="pills" style={{ marginTop: 12 }}>
                  {momoProviders.map((m) => (
                    <button key={m} type="button" className={`pill ${pay.provider === m ? 'sel' : ''}`} onClick={() => setPay({ ...pay, provider: m })}>{m}</button>
                  ))}
                </div>
                <div className="field" style={{ marginTop: 6 }}>
                  <label htmlFor="sub-momo">Numéro {pay.provider} <b>*</b></label>
                  <input id="sub-momo" type="tel" value={pay.phone} onChange={(e) => setPay({ ...pay, phone: e.target.value })} placeholder="Ex. +228 90 12 34 56" />
                  <p className="ferr" />
                </div>
              </>
            )}
            {pay.method === 'card' && (
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="sub-card">Numéro de carte <b>*</b></label>
                <input id="sub-card" type="text" inputMode="numeric" value={pay.card} onChange={(e) => setPay({ ...pay, card: e.target.value })} placeholder="4242 4242 4242 4242" />
                <p className="ferr" />
              </div>
            )}
            {err && <p className="error-note" style={{ marginTop: 12 }}>{err}</p>}
            <div className="m-actions">
              <button className="btn btn-primary" onClick={doPay} disabled={busy}>
                {busy && <span className="spinner" />}
                Payer {fmtPrice(SUBSCRIPTION_PRICE, 'XOF')}
              </button>
            </div>
            <p className="m-note">
              <strong>Paiement simulé</strong> — aucun débit réel en démonstration. En production, un prestataire
              Mobile Money africain (CinetPay, PayDunya, Kkiapay…) sera intégré via API.
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
