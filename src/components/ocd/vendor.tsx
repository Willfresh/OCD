'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useApp, api, fmtPrice, fmtDate, fmtDateTime } from './store'
import { LoadingCards, EmptyState } from './chrome'
import { Flag } from './Flag'
import { CatIcon, WhatsAppIcon } from './icons'
import { CATEGORIES, COUNTRIES, COUNTRY_MAP, CATEGORY_MAP, SLOTS } from '@/lib/ocd/constants'

interface MyLive {
  id: string
  displayName: string
  country: string
  category: string
  slot: string
  mode: string
  platform: string
  liveUrl: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
  scheduledDate: string | null
  runtimeStatus: string | null
  startsAtLabel: string | null
  shop: { name: string; slug: string } | null
}
interface MyProduct {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  images: string[]
  isActive: boolean
  isFeatured: boolean
  isDemo: boolean
}
interface MyShop {
  id: string
  name: string
  slug: string
  description: string
  category: string
  country: string
  city: string
  logoUrl: string | null
  bannerUrl: string | null
  whatsapp: string | null
  isActive: boolean
  isDemo: boolean
  products: MyProduct[]
}
interface MyOrder {
  id: string
  product: { name: string; price: number | null; currency?: string }
  buyerName: string
  buyerPhone: string
  buyerCountry: string | null
  quantity: number
  message: string | null
  status: string
  isDemo: boolean
  createdAt: string
}
interface MySub {
  active: { endDate: string; amount: number; isDemo: boolean } | null
  payments: { reference: string; amount: number; method: string; provider: string | null; status: string; createdAt: string }[]
}

export function VendorDashboard() {
  const { user, navigate, toast, refreshUser } = useApp()
  const [tab, setTab] = useState<'lives' | 'boutique' | 'abonnement' | 'commandes'>('lives')
  const [lives, setLives] = useState<MyLive[] | null>(null)
  const [shop, setShop] = useState<MyShop | null>(null)
  const [orders, setOrders] = useState<MyOrder[] | null>(null)
  const [sub, setSub] = useState<MySub | null>(null)

  useEffect(() => {
    if (!user) return
    api<{ lives: MyLive[] }>('/api/lives/mine').then((d) => setLives(d.lives)).catch(() => setLives([]))
    api<{ shop: MyShop | null; liveStatus: { status: string; startsAtLabel: string } | null }>('/api/shops/mine').then((d) => setShop(d.shop)).catch(() => setShop(null))
  }, [user])

  useEffect(() => {
    if (!user) return
    if (tab === 'commandes' && orders === null) {
      api<{ orders: MyOrder[] }>('/api/orders').then((d) => setOrders(d.orders)).catch(() => setOrders([]))
    }
    if (tab === 'abonnement' && sub === null) {
      api<MySub>('/api/subscription').then((d) => setSub(d)).catch(() => setSub({ active: null, payments: [] }))
    }
  }, [tab, user, orders, sub])

  if (!user) {
    return (
      <main className="dash-wrap">
        <EmptyState
          title="Connectez-vous pour accéder à votre espace vendeur"
          action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/connexion?retour=/espace-vendeur')}>Se connecter</button>}
        />
      </main>
    )
  }
  if (user.role === 'ADMIN') {
    return (
      <main className="dash-wrap">
        <EmptyState
          title="Ceci est un compte régie"
          sub="Les administrateurs gèrent les validations depuis l'espace régie."
          action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/regie')}>Ouvrir l&apos;espace régie</button>}
        />
      </main>
    )
  }

  const pendingCount = (lives ?? []).filter((l) => l.status === 'PENDING').length

  return (
    <main className="dash-wrap">
      <p className="eyebrow">Espace vendeur — {user.name}</p>
      <h1 className="sec-title" style={{ fontSize: 'clamp(1.6rem,3.4vw,2.3rem)' }}>Ma vitrine OCD</h1>
      <p className="sec-sub">Vos lives, votre boutique, votre abonnement et vos commandes — au même endroit.</p>

      <div className="dash-tabs">
        <button className={`dash-tab ${tab === 'lives' ? 'sel' : ''}`} onClick={() => setTab('lives')}>
          Mes lives {pendingCount > 0 && <span className="cnt">{pendingCount}</span>}
        </button>
        <button className={`dash-tab ${tab === 'boutique' ? 'sel' : ''}`} onClick={() => setTab('boutique')}>
          Ma boutique {shop && <span className="cnt">{shop.products.length}</span>}
        </button>
        <button className={`dash-tab ${tab === 'abonnement' ? 'sel' : ''}`} onClick={() => setTab('abonnement')}>Mon abonnement</button>
        <button className={`dash-tab ${tab === 'commandes' ? 'sel' : ''}`} onClick={() => setTab('commandes')}>
          Mes commandes {orders && <span className="cnt">{orders.filter((o) => o.status === 'NEW').length}</span>}
        </button>
      </div>

      {tab === 'lives' && <LivesTab lives={lives} />}
      {tab === 'boutique' && <ShopTab shop={shop} onSaved={() => api<{ shop: MyShop | null }>('/api/shops/mine').then((d) => setShop(d.shop))} />}
      {tab === 'abonnement' && <SubTab sub={sub} />}
      {tab === 'commandes' && <OrdersTab orders={orders} setOrders={setOrders} />}
    </main>
  )
}

function StatusBadge({ l }: { l: MyLive }) {
  if (l.status === 'PENDING') return <span className="badge badge-wait">EN ATTENTE DE VALIDATION</span>
  if (l.status === 'REJECTED') return <span className="badge badge-bad">REFUSÉ</span>
  if (l.status === 'ENDED' || l.status === 'EXPIRED') return <span className="badge">TERMINÉ</span>
  if (l.runtimeStatus === 'LIVE') return <span className="badge badge-live-on"><span className="dot" />EN DIRECT MAINTENANT</span>
  if (l.runtimeStatus === 'UPCOMING_TODAY') return <span className="badge badge-ok">VALIDÉ · {l.startsAtLabel}</span>
  return <span className="badge badge-ok">VALIDÉ</span>
}

function LivesTab({ lives }: { lives: MyLive[] | null }) {
  const { navigate } = useApp()
  if (lives === null) return <LoadingCards n={3} h={160} />
  if (lives.length === 0) {
    return (
      <EmptyState
        title="Aucun live soumis pour l'instant"
        sub="Réservez votre premier créneau — matin 08h–11h ou soir 18h–21h."
        action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/soumettre')}>Soumettre mon live</button>}
      />
    )
  }
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {lives.map((l) => (
        <article key={l.id} className={`review-card ${l.status === 'PENDING' ? 'is-pending' : ''}`}>
          <div className="review-top">
            <div>
              <b style={{ fontSize: '1.05rem' }}>{l.displayName}</b>
              <div className="lc-meta" style={{ marginTop: 4 }}>
                <Flag code={l.country} size={15} />
                {COUNTRY_MAP[l.country]?.name} · {CATEGORY_MAP[l.category]?.label ?? l.category}
                {l.shop && <>· boutique {l.shop.name}</>}
              </div>
            </div>
            <StatusBadge l={l} />
          </div>
          <div className="review-rows">
            <span>Créneau : <b>{l.slot === 'MATIN' ? 'Matin 08h–11h' : 'Soir 18h–21h'}</b> · {l.mode === 'presentiel' ? 'présentiel (régie OCD)' : 'à distance'}{l.scheduledDate ? ` · prévu ${fmtDate(l.scheduledDate)}` : ''}</span>
            <span>Soumis le : <b>{fmtDateTime(l.createdAt)}</b></span>
            {l.liveUrl && (
              <span>Lien : <a href={l.liveUrl} target="_blank" rel="noopener" style={{ fontWeight: 700, wordBreak: 'break-all' }}>{l.liveUrl}</a></span>
            )}
            {l.status === 'REJECTED' && l.rejectionReason && (
              <p className="error-note" style={{ marginTop: 4 }}>Motif de la régie : {l.rejectionReason}</p>
            )}
            {l.status === 'VALIDATED' && l.runtimeStatus === 'LIVE' && (
              <p className="info-note" style={{ marginTop: 4 }}>Votre fiche est visible sur OCD Live en ce moment — bon commerce !</p>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

/* ---------------- Boutique + produits ---------------- */
function ShopTab({ shop, onSaved }: { shop: MyShop | null; onSaved: () => void }) {
  const { user, toast, navigate } = useApp()
  const [form, setForm] = useState({ name: '', description: '', category: '', country: '', city: '', whatsapp: '', logoUrl: '', bannerUrl: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [prodOpen, setProdOpen] = useState(false)
  const [prodForm, setProdForm] = useState({ name: '', description: '', price: '', category: '', images: [] as string[] })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name,
        description: shop.description,
        category: shop.category,
        country: shop.country,
        city: shop.city,
        whatsapp: shop.whatsapp ?? '',
        logoUrl: shop.logoUrl ?? '',
        bannerUrl: shop.bannerUrl ?? '',
      })
    } else if (user) {
      setForm((f) => ({ ...f, country: f.country || user.country || '', city: f.city || user.city || '', whatsapp: f.whatsapp || user.phone || '' }))
    }
  }, [shop, user])

  const saveShop = async () => {
    setErr('')
    if (form.name.trim().length < 2) return setErr('Nom de boutique trop court.')
    if (!form.category) return setErr('Choisissez une catégorie.')
    if (!form.country) return setErr('Choisissez votre pays.')
    if (form.city.trim().length < 2) return setErr('Indiquez votre ville.')
    setBusy(true)
    try {
      if (shop) {
        await api('/api/shops', { method: 'PATCH', body: form })
      } else {
        await api('/api/shops', { method: 'POST', body: form })
      }
      onSaved()
      toast('Boutique enregistrée !', 'ok')
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const addProduct = async () => {
    setErr('')
    if (prodForm.name.trim().length < 2) return setErr('Nom du produit requis.')
    if (!prodForm.price || Number(prodForm.price) < 100) return setErr('Prix minimum : 100.')
    if (!prodForm.category) return setErr('Choisissez une catégorie.')
    setBusy(true)
    try {
      await api('/api/products', {
        method: 'POST',
        body: { ...prodForm, price: Number(prodForm.price), images: prodForm.images },
      })
      setProdOpen(false)
      setProdForm({ name: '', description: '', price: '', category: '', images: [] })
      onSaved()
      toast('Produit ajouté à votre boutique !', 'ok')
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const uploadImage = async (file: File, target: 'logo' | 'banner' | 'product') => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Téléversement impossible.')
      if (target === 'logo') setForm((f) => ({ ...f, logoUrl: d.url }))
      else if (target === 'banner') setForm((f) => ({ ...f, bannerUrl: d.url }))
      else setProdForm((p) => ({ ...p, images: [...p.images, d.url].slice(0, 6) }))
      toast('Image téléversée.', 'ok')
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    } finally {
      setUploading(false)
    }
  }

  const delProduct = async (id: string) => {
    try {
      await api(`/api/products?id=${id}`, { method: 'DELETE' })
      onSaved()
      toast('Produit supprimé.', 'ok')
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    }
  }

  const toggleProduct = async (p: MyProduct, key: 'isActive' | 'isFeatured') => {
    try {
      await api('/api/products', { method: 'PATCH', body: { id: p.id, [key]: !p[key] } })
      onSaved()
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    }
  }

  return (
    <>
      <div className="review-card">
        <div className="review-top">
          <div>
            <b style={{ fontSize: '1.05rem' }}>{shop ? 'Ma boutique : ' + shop.name : 'Créer ma boutique'}</b>
            {shop && (
              <div className="lc-meta" style={{ marginTop: 4 }}>
                <Flag code={shop.country} size={15} />
                {COUNTRY_MAP[shop.country]?.name} · {shop.city} · {CATEGORY_MAP[shop.category]?.label}
                <button
                  style={{ background: 'none', border: 'none', padding: '0 0 0 4px', font: 'inherit', fontWeight: 700, color: 'var(--accent-text)', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/boutique/${shop.slug}`)}
                >
                  Voir ma page publique
                </button>
              </div>
            )}
          </div>
          {shop && <span className={`badge ${shop.isActive ? 'badge-ok' : 'badge-bad'}`}>{shop.isActive ? 'VISIBLE' : 'MASQUÉE'}</span>}
        </div>
        <div className="fgrid">
          <div className="field f-full">
            <label htmlFor="sh-name">Nom de la boutique <b>*</b></label>
            <input id="sh-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Chez Maman Awa" />
            <p className="ferr" />
          </div>
          <div className="field f-full">
            <label htmlFor="sh-desc">Description <small>(visible sur votre page)</small></label>
            <textarea id="sh-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Votre histoire, vos spécialités, vos horaires…" />
            <p className="ferr" />
          </div>
          <div className="field">
            <label htmlFor="sh-cat">Catégorie <b>*</b></label>
            <select id="sh-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">— Choisir —</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <p className="ferr" />
          </div>
          <div className="field">
            <label htmlFor="sh-country">Pays <b>*</b></label>
            <select id="sh-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              <option value="">— Choisir —</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <p className="ferr" />
          </div>
          <div className="field">
            <label htmlFor="sh-city">Ville <b>*</b></label>
            <input id="sh-city" type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex. Cotonou" />
            <p className="ferr" />
          </div>
          <div className="field">
            <label htmlFor="sh-wa">Numéro WhatsApp <small>(commandes clients)</small></label>
            <input id="sh-wa" type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+229 90 12 34 56" />
            <p className="ferr" />
          </div>
          <div className="field">
            <label htmlFor="sh-logo">Logo / photo <small>(JPG, PNG — max 4 Mo)</small></label>
            <input id="sh-logo" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'logo')} />
            {form.logoUrl && <img src={form.logoUrl} alt="" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', marginTop: 8, border: '1px solid var(--line)' }} />}
            {uploading && <p className="ferr">Téléversement…</p>}
          </div>
          <div className="field">
            <label htmlFor="sh-banner">Bannière <small>(facultatif)</small></label>
            <input id="sh-banner" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], 'banner')} />
            {form.bannerUrl && <img src={form.bannerUrl} alt="" style={{ width: '100%', height: 60, borderRadius: 12, objectFit: 'cover', marginTop: 8, border: '1px solid var(--line)' }} />}
          </div>
        </div>
        {err && <p className="error-note" style={{ marginTop: 10 }}>{err}</p>}
        <div className="review-actions">
          <button className="btn btn-primary" onClick={saveShop} disabled={busy}>
            {busy && <span className="spinner" />}
            {shop ? 'Enregistrer les modifications' : 'Créer ma boutique'}
          </button>
          {shop && (
            <button className="btn btn-ghost" onClick={() => setProdOpen(true)}>+ Ajouter un produit</button>
          )}
        </div>
      </div>

      {shop && (
        <>
          <h2 style={{ marginTop: 26, fontSize: '1.2rem', fontWeight: 900 }}>Mes produits ({shop.products.length})</h2>
          {shop.products.length === 0 ? (
            <div className="info-note" style={{ marginTop: 12 }}>
              Ajoutez vos premiers produits : photos, prix et description — les acheteurs pourront commander directement.
            </div>
          ) : (
            <div className="product-grid" style={{ marginTop: 12 }}>
              {shop.products.map((p) => (
                <article key={p.id} className="product-card">
                  <div className="pc-photo">
                    {p.images[0] ? <img src={p.images[0]} alt={p.name} /> : <div style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--icon-bg)', color: 'var(--accent-strong)', fontWeight: 900 }}>OCD</div>}
                    <div className="lc-overlay">
                      {!p.isActive && <span className="badge badge-bad">MASQUÉ</span>}
                      {p.isFeatured && <span className="badge badge-ok">EN VEDETTE</span>}
                      {p.isDemo && <span className="badge badge-demo">DÉMO</span>}
                    </div>
                  </div>
                  <div className="pc-body">
                    <span className="pc-name">{p.name}</span>
                    <span className="pc-price">{fmtPrice(p.price, p.currency)}</span>
                    <span className="lc-meta" style={{ fontSize: '0.78rem' }}>
                      <CatIcon id={CATEGORY_MAP[p.category]?.icon ?? 'store'} size={13} />
                      {CATEGORY_MAP[p.category]?.label ?? p.category}
                    </span>
                    <div className="pc-actions">
                      <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '8px 12px' }} onClick={() => toggleProduct(p, 'isActive')}>{p.isActive ? 'Masquer' : 'Afficher'}</button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '8px 12px' }} onClick={() => toggleProduct(p, 'isFeatured')}>{p.isFeatured ? 'Retirer vedette' : 'En vedette'}</button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.78rem', padding: '8px 12px', color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => delProduct(p.id)}>Supprimer</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal ajout produit */}
      {prodOpen && (
        <div className="modal open" role="dialog" aria-modal="true" aria-label="Ajouter un produit">
          <div className="modal-overlay" onClick={() => setProdOpen(false)} />
          <div className="modal-panel">
            <button className="modal-close" onClick={() => setProdOpen(false)} aria-label="Fermer">✕</button>
            <p className="m-mode"><span className="pulse-dot" />Nouveau produit</p>
            <h3 className="m-title">Ajouter à ma boutique</h3>
            <div className="fgrid">
              <div className="field f-full">
                <label htmlFor="p-name">Nom du produit <b>*</b></label>
                <input id="p-name" type="text" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Ex. Robe wax — modèle Adjovi" />
                <p className="ferr" />
              </div>
              <div className="field f-full">
                <label htmlFor="p-desc">Description <small>(facultatif)</small></label>
                <textarea id="p-desc" rows={2} value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} placeholder="Tissu, tailles, couleurs, livraison…" />
                <p className="ferr" />
              </div>
              <div className="field">
                <label htmlFor="p-price">Prix <b>*</b> <small>(entier)</small></label>
                <input id="p-price" type="number" min={100} value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} placeholder="Ex. 4500" />
                <p className="ferr" />
              </div>
              <div className="field">
                <label htmlFor="p-cat">Catégorie <b>*</b></label>
                <select id="p-cat" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <p className="ferr" />
              </div>
              <div className="field f-full">
                <label htmlFor="p-img">Photos <small>(jusqu&apos;à 6 — JPG/PNG, 4 Mo max)</small></label>
                <input id="p-img" type="file" accept="image/*" multiple onChange={(e) => Array.from(e.target.files ?? []).slice(0, 6).forEach((f) => uploadImage(f, 'product'))} />
                {uploading && <p className="ferr">Téléversement en cours…</p>}
                {prodForm.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {prodForm.images.map((src) => (
                      <span key={src} style={{ position: 'relative' }}>
                        <img src={src} alt="" style={{ width: 54, height: 54, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--line)' }} />
                        <button
                          onClick={() => setProdForm((p) => ({ ...p, images: p.images.filter((i) => i !== src) }))}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--bad)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'grid', placeItems: 'center' }}
                          aria-label="Retirer la photo"
                        >✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {err && <p className="error-note" style={{ marginTop: 12 }}>{err}</p>}
            <div className="m-actions">
              <button className="btn btn-primary" onClick={addProduct} disabled={busy || uploading}>
                {busy && <span className="spinner" />}
                Ajouter le produit
              </button>
              <button className="btn btn-ghost" onClick={() => setProdOpen(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SubTab({ sub }: { sub: MySub | null }) {
  const { navigate } = useApp()
  if (sub === null) return <div className="skeleton" style={{ height: 160 }} />
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="pay-summary">
        <h3 style={{ fontSize: '0.78rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-ink)', margin: '0 0 12px' }}>Statut</h3>
        {sub.active ? (
          <div className="sum-rows">
            <div className="sum-row"><span>Statut</span><b style={{ color: 'var(--ok)' }}>ACTIF</b></div>
            <div className="sum-row"><span>Valable jusqu&apos;au</span><b>{fmtDateTime(sub.active.endDate)}</b></div>
            <div className="sum-row"><span>Montant</span><b>{fmtPrice(sub.active.amount, 'XOF')} / mois</b></div>
          </div>
        ) : (
          <div className="sum-rows">
            <div className="sum-row"><span>Statut</span><b style={{ color: 'var(--bad)' }}>EXPIRÉ — aucune soumission possible</b></div>
          </div>
        )}
        <div className="m-actions" style={{ marginTop: 14, paddingTop: 0 }}>
          <button className="btn btn-primary" onClick={() => navigate('/abonnement')}>{sub.active ? 'Renouveler depuis la page abonnement' : 'M&apos;abonner — 5 000 FCFA'}</button>
        </div>
      </div>
      {sub.payments.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <thead><tr><th>Référence</th><th>Date</th><th>Moyen</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
              {sub.payments.map((p) => (
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
      )}
    </div>
  )
}

function OrdersTab({ orders, setOrders }: { orders: MyOrder[] | null; setOrders: (o: MyOrder[]) => void }) {
  const { toast } = useApp()
  const setStatus = async (id: string, status: string) => {
    try {
      await api('/api/orders', { method: 'PATCH', body: { id, status } })
      setOrders((orders ?? []).map((o) => (o.id === id ? { ...o, status } : o)))
      toast('Commande mise à jour.', 'ok')
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    }
  }
  if (orders === null) return <LoadingCards n={3} h={140} />
  if (orders.length === 0) {
    return <EmptyState title="Aucune commande reçue" sub="Ajoutez des produits à votre boutique : les acheteurs commandent en 2 touches." />
  }
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {orders.map((o) => (
        <article key={o.id} className="review-card">
          <div className="review-top">
            <div>
              <b>{o.product.name} ×{o.quantity}</b>
              <div className="lc-meta" style={{ marginTop: 4 }}>Commande du {fmtDateTime(o.createdAt)}{o.isDemo && <> · <span className="badge badge-demo">DÉMO</span></>}</div>
            </div>
            <span className={`badge ${o.status === 'NEW' ? 'badge-wait' : o.status === 'DELIVERED' ? 'badge-ok' : o.status === 'CANCELLED' ? 'badge-bad' : 'badge-ok'}`}>
              {o.status === 'NEW' ? 'NOUVELLE' : o.status === 'CONFIRMED' ? 'CONFIRMÉE' : o.status === 'DELIVERED' ? 'LIVRÉE' : 'ANNULÉE'}
            </span>
          </div>
          <div className="review-rows">
            <span>Acheteur : <b>{o.buyerName}</b> — {o.buyerPhone}{o.buyerCountry && <> ({COUNTRY_MAP[o.buyerCountry]?.name ?? o.buyerCountry})</>}</span>
            {o.message && <span style={{ display: 'block' }}>Message : « {o.message} »</span>}
          </div>
          <div className="review-actions">
            {o.status === 'NEW' && (
              <>
                <button className="btn btn-primary btn-sm" onClick={() => setStatus(o.id, 'CONFIRMED')}>Confirmer</button>
                <a className="btn btn-ghost btn-sm" href={`https://wa.me/${o.buyerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${o.buyerName}, votre commande « ${o.product.name} » sur OCD Shop est confirmée !`)}`} target="_blank" rel="noopener">
                  <WhatsAppIcon size={15} /> WhatsApp
                </a>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => setStatus(o.id, 'CANCELLED')}>Annuler</button>
              </>
            )}
            {o.status === 'CONFIRMED' && <button className="btn btn-primary btn-sm" onClick={() => setStatus(o.id, 'DELIVERED')}>Marquer livrée</button>}
          </div>
        </article>
      ))}
    </div>
  )
}
