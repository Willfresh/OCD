'use client'

import React, { useEffect, useState } from 'react'
import { useApp, api, fmtPrice, fmtDateTime, initials } from './store'
import { LoadingCards, EmptyState } from './chrome'
import { Flag } from './Flag'
import { CATEGORY_MAP, COUNTRY_MAP } from '@/lib/ocd/constants'

interface AdminLive {
  id: string
  displayName: string
  vendorName: string
  vendorEmail: string
  vendorPhone: string | null
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
  isDemo: boolean
  runtimeStatus: string | null
  startsAtLabel: string | null
  shop: { name: string; slug: string } | null
  isDemoVendor: boolean
}
interface Overview {
  stats: Record<string, number>
  recentLives: { id: string; displayName: string; vendorName: string; country: string; status: string; isDemo: boolean; createdAt: string }[]
  byCountry: { code: string; enDirect: number; prochains: number; boutiques: number }[]
  byCategory: { id: string; count: number }[]
  shops: { id: string; name: string; slug: string; country: string; city: string; category: string; owner: { name: string; email: string; isDemo: boolean }; productCount: number; isActive: boolean; isDemo: boolean; createdAt: string }[]
  orders: { id: string; product: string; shop: string; buyerName: string; buyerPhone: string; buyerCountry: string | null; quantity: number; status: string; isDemo: boolean; createdAt: string }[]
  payments: { reference: string; amount: number; method: string; provider: string | null; status: string; vendor: { name: string; email: string; isDemo: boolean }; createdAt: string }[]
}
interface AdminUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  country: string | null
  city: string | null
  avatarUrl: string | null
  isDemo: boolean
  createdAt: string
  shop: { name: string; slug: string; isActive: boolean; country: string; city: string; productCount: number; ordersCount: number } | null
  livesCount: number
  activeLives: number
  pendingLives: number
  subscription: { endDate: string; isDemo: boolean } | null
}
interface AdminProduct {
  id: string
  name: string
  price: number
  currency: string
  category: string
  categoryLabel: string
  images: string[]
  isActive: boolean
  isFeatured: boolean
  isDemo: boolean
  createdAt: string
  shop: { id: string; name: string; slug: string; country: string; city: string; isActive: boolean }
}

type Tab = 'vue' | 'validation' | 'lives' | 'boutiques' | 'produits' | 'commandes' | 'paiements' | 'vendeurs'

export function AdminDashboard() {
  const { user, navigate, toast, logout } = useApp()
  const [tab, setTab] = useState<Tab>('vue')
  const [lives, setLives] = useState<AdminLive[] | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [refuseId, setRefuseId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  // Filtres
  const [liveFilter, setLiveFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ENDED'>('ALL')
  const [liveQ, setLiveQ] = useState('')
  const [shopQ, setShopQ] = useState('')
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'NEW' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'>('ALL')
  const [orderQ, setOrderQ] = useState('')
  const [payQ, setPayQ] = useState('')
  const [userFilter, setUserFilter] = useState<'ALL' | 'VENDOR' | 'ADMIN'>('ALL')
  const [userQ, setUserQ] = useState('')
  const [prodQ, setProdQ] = useState('')
  const [prodFilter, setProdFilter] = useState<'ALL' | 'VISIBLE' | 'MASQUES'>('ALL')
  const [delProdId, setDelProdId] = useState<string | null>(null)

  const load = () => {
    api<{ lives: AdminLive[] }>('/api/admin/lives').then((d) => setLives(d.lives)).catch(() => setLives([]))
    api<Overview>('/api/admin/overview').then((d) => setOverview(d)).catch(() => setOverview(null))
    api<{ users: AdminUser[] }>('/api/admin/users').then((d) => setUsers(d.users)).catch(() => setUsers([]))
    api<{ products: AdminProduct[] }>('/api/admin/products').then((d) => setProducts(d.products)).catch(() => setProducts([]))
  }
  useEffect(load, [])

  if (!user) {
    return (
      <main className="dash-wrap">
        <EmptyState
          title="Espace réservé à la régie OCD Bovann"
          sub="Connectez-vous avec un compte administrateur."
          action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/connexion?retour=/regie')}>Connexion régie</button>}
        />
      </main>
    )
  }
  if (user.role !== 'ADMIN') {
    return (
      <main className="dash-wrap">
        <EmptyState title="Accès refusé" sub="Cet espace est réservé aux équipes de validation OCD." action={<button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/espace-vendeur')}>Mon espace vendeur</button>} />
      </main>
    )
  }

  const act = async (id: string, action: 'accept' | 'refuse' | 'end', reasonText?: string) => {
    if (action === 'refuse' && (!reasonText || reasonText.trim().length < 3)) {
      return
    }
    setBusy(true)
    try {
      await api('/api/admin/lives', { method: 'PATCH', body: { id, action, reason: reasonText ?? '' } })
      load()
      if (action === 'refuse') {
        setRefuseId(null)
        setReason('')
      }
    } catch {
      load()
    } finally {
      setBusy(false)
    }
  }

  const patchShop = async (id: string, isActive: boolean) => {
    try {
      await api('/api/admin/shops', { method: 'PATCH', body: { id, isActive } })
      load()
    } catch {}
  }

  const patchOrder = async (id: string, status: string) => {
    try {
      await api('/api/orders', { method: 'PATCH', body: { id, status } })
      load()
      toast('Commande mise à jour.', 'ok')
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    }
  }

  const patchProduct = async (id: string, patch: Record<string, unknown>) => {
    try {
      await api('/api/admin/products', { method: 'PATCH', body: { id, ...patch } })
      load()
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    }
  }

  const delProduct = async (id: string) => {
    try {
      await api(`/api/admin/products?id=${id}`, { method: 'DELETE' })
      setDelProdId(null)
      load()
      toast('Produit retiré de la marketplace.', 'ok')
    } catch (ex) {
      toast((ex as Error).message, 'bad')
    }
  }

  const all = lives ?? []
  const pending = all.filter((l) => l.status === 'PENDING')
  const validated = all.filter((l) => l.status === 'VALIDATED')
  const refused = all.filter((l) => l.status === 'REJECTED')
  const ended = all.filter((l) => l.status === 'ENDED' || l.status === 'EXPIRED')

  return (
    <main className="dash-wrap">
      <p className="eyebrow">Espace régie — OCD Bovann</p>
      <h1 className="sec-title" style={{ fontSize: 'clamp(1.6rem,3.4vw,2.3rem)' }}>Le poste de validation</h1>
      <p className="sec-sub">
        Vérifiez chaque live soumis : ouvrez le lien, contrôlez que le vendeur est bien en train de vendre, puis
        acceptez ou refusez. Les lives validés apparaissent automatiquement sur OCD Live — et disparaissent quand
        leur créneau expire.
      </p>

      {/* Identité de l'administrateur connecté */}
      <div className="adm-head">
        {user.avatarUrl ? (
          <img className="adm-ava" src={user.avatarUrl} alt={user.name} />
        ) : (
          <span className="adm-ava">{initials(user.name)}</span>
        )}
        <div className="adm-id">
          <b style={{ fontSize: '1.06rem' }}>{user.name} <span className="badge badge-live-on" style={{ marginLeft: 6 }}><span className="dot" />RÉGIE</span></b>
          <p className="lc-meta" style={{ marginTop: 2 }}>{user.email} · validations, boutiques, produits, commandes & paiements</p>
        </div>
        <div className="adm-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/profil')}>Mon profil</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => logout()}>Déconnexion</button>
        </div>
      </div>

      <div className="dash-tabs">
        <button className={`dash-tab ${tab === 'vue' ? 'sel' : ''}`} onClick={() => setTab('vue')}>Vue d&apos;ensemble</button>
        <button className={`dash-tab ${tab === 'validation' ? 'sel' : ''}`} onClick={() => setTab('validation')}>
          À valider {pending.length > 0 && <span className="cnt">{pending.length}</span>}
        </button>
        <button className={`dash-tab ${tab === 'lives' ? 'sel' : ''}`} onClick={() => setTab('lives')}>Lives</button>
        <button className={`dash-tab ${tab === 'boutiques' ? 'sel' : ''}`} onClick={() => setTab('boutiques')}>Boutiques</button>
        <button className={`dash-tab ${tab === 'produits' ? 'sel' : ''}`} onClick={() => setTab('produits')}>Produits</button>
        <button className={`dash-tab ${tab === 'commandes' ? 'sel' : ''}`} onClick={() => setTab('commandes')}>Commandes</button>
        <button className={`dash-tab ${tab === 'paiements' ? 'sel' : ''}`} onClick={() => setTab('paiements')}>Paiements</button>
        <button className={`dash-tab ${tab === 'vendeurs' ? 'sel' : ''}`} onClick={() => setTab('vendeurs')}>Vendeurs</button>
      </div>

      {tab === 'vue' && <OverviewTab o={overview} />}
      {tab === 'validation' && (
        lives === null ? <LoadingCards n={3} h={200} /> : pending.length === 0 ? (
          <EmptyState title="Aucune demande en attente" sub="Toutes les soumissions ont été traitées — beau travail, régie !" />
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {pending.map((l) => (
              <ReviewCard key={l.id} l={l} busy={busy} act={act} refuseId={refuseId} setRefuseId={setRefuseId} reason={reason} setReason={setReason} pending />
            ))}
          </div>
        )
      )}

      {tab === 'lives' && (
        <>
          <div className="adm-toolbar">
            <div className="field">
              <input type="search" value={liveQ} onChange={(e) => setLiveQ(e.target.value)} placeholder="Rechercher : vendeur, live, boutique…" aria-label="Rechercher un live" />
            </div>
            <button className={`fchip ${liveFilter === 'ALL' ? 'sel' : ''}`} onClick={() => setLiveFilter('ALL')}>Tous ({all.length})</button>
            <button className={`fchip ${liveFilter === 'PENDING' ? 'sel' : ''}`} onClick={() => setLiveFilter('PENDING')}>En attente ({pending.length})</button>
            <button className={`fchip ${liveFilter === 'VALIDATED' ? 'sel' : ''}`} onClick={() => setLiveFilter('VALIDATED')}>Validés ({validated.length})</button>
            <button className={`fchip ${liveFilter === 'REJECTED' ? 'sel' : ''}`} onClick={() => setLiveFilter('REJECTED')}>Refusés ({refused.length})</button>
            <button className={`fchip ${liveFilter === 'ENDED' ? 'sel' : ''}`} onClick={() => setLiveFilter('ENDED')}>Terminés ({ended.length})</button>
          </div>
          {lives === null ? <LoadingCards n={3} h={200} /> : (() => {
            const q = liveQ.trim().toLowerCase()
            const rows = all.filter((l) => {
              if (liveFilter === 'PENDING' && l.status !== 'PENDING') return false
              if (liveFilter === 'VALIDATED' && l.status !== 'VALIDATED') return false
              if (liveFilter === 'REJECTED' && l.status !== 'REJECTED') return false
              if (liveFilter === 'ENDED' && !(l.status === 'ENDED' || l.status === 'EXPIRED')) return false
              if (q && !`${l.displayName} ${l.vendorName} ${l.vendorEmail} ${l.shop?.name ?? ''}`.toLowerCase().includes(q)) return false
              return true
            })
            return rows.length === 0 ? (
              <EmptyState title="Aucun live pour ce filtre" sub="Changez le statut ou la recherche." />
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {rows.map((l) => (
                  <ReviewCard key={l.id} l={l} busy={busy} act={act} refuseId={refuseId} setRefuseId={setRefuseId} reason={reason} setReason={setReason} />
                ))}
              </div>
            )
          })()}
        </>
      )}

      {tab === 'boutiques' && overview && (() => {
        const q = shopQ.trim().toLowerCase()
        const rows = overview.shops.filter((s) => !q || `${s.name} ${s.owner.name} ${s.owner.email} ${s.city} ${COUNTRY_MAP[s.country]?.name ?? ''}`.toLowerCase().includes(q))
        return (
          <>
            <div className="adm-toolbar">
              <div className="field">
                <input type="search" value={shopQ} onChange={(e) => setShopQ(e.target.value)} placeholder="Rechercher : boutique, vendeur, ville…" aria-label="Rechercher une boutique" />
              </div>
              <span className="pd-crumb">{rows.length} boutique{rows.length > 1 ? 's' : ''}</span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Boutique</th><th>Vendeur</th><th>Pays · ville</th><th>Catégorie</th><th>Produits</th><th>Statut</th><th>Action</th></tr></thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td><b>{s.name}</b>{s.isDemo && <> <span className="badge badge-demo">DÉMO</span></>}</td>
                      <td>{s.owner.name}<br /><span style={{ color: 'var(--muted-ink)', fontSize: '0.78rem' }}>{s.owner.email}</span></td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flag code={s.country} size={14} /> {COUNTRY_MAP[s.country]?.name} · {s.city}</span></td>
                      <td>{CATEGORY_MAP[s.category]?.label ?? s.category}</td>
                      <td>{s.productCount}</td>
                      <td><span className={`badge ${s.isActive ? 'badge-ok' : 'badge-bad'}`}>{s.isActive ? 'VISIBLE' : 'MASQUÉE'}</span></td>
                      <td>
                        <div className="act-row">
                          <button className="btn btn-ghost btn-sm" onClick={() => patchShop(s.id, !s.isActive)}>{s.isActive ? 'Masquer' : 'Réactiver'}</button>
                          <button className="btn btn-site btn-sm" onClick={() => navigate(`/boutique/${s.slug}`)}>Voir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      })()}

      {tab === 'produits' && (() => {
        if (products === null) return <LoadingCards n={4} h={140} />
        const q = prodQ.trim().toLowerCase()
        const rows = products.filter((p) => {
          if (prodFilter === 'VISIBLE' && !p.isActive) return false
          if (prodFilter === 'MASQUES' && p.isActive) return false
          if (q && !`${p.name} ${p.shop.name} ${p.categoryLabel}`.toLowerCase().includes(q)) return false
          return true
        })
        return (
          <>
            <div className="adm-toolbar">
              <div className="field">
                <input type="search" value={prodQ} onChange={(e) => setProdQ(e.target.value)} placeholder="Rechercher : article, boutique, catégorie…" aria-label="Rechercher un produit" />
              </div>
              <button className={`fchip ${prodFilter === 'ALL' ? 'sel' : ''}`} onClick={() => setProdFilter('ALL')}>Tous ({products.length})</button>
              <button className={`fchip ${prodFilter === 'VISIBLE' ? 'sel' : ''}`} onClick={() => setProdFilter('VISIBLE')}>Visibles</button>
              <button className={`fchip ${prodFilter === 'MASQUES' ? 'sel' : ''}`} onClick={() => setProdFilter('MASQUES')}>Masqués</button>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucun produit pour ce filtre" sub="Changez la recherche ou le filtre de visibilité." />
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Photo</th><th>Article</th><th>Boutique</th><th>Prix</th><th>Photos</th><th>Statut</th><th>Actions</th></tr></thead>
                  <tbody>
                    {rows.map((p) => (
                      <tr key={p.id}>
                        <td>{p.images[0] ? <img className="pthumb" src={p.images[0]} alt="" /> : <span className="pthumb" style={{ display: 'grid', placeItems: 'center', background: 'var(--icon-bg)', color: 'var(--accent-strong)', fontWeight: 900, fontSize: '0.7rem' }}>OCD</span>}</td>
                        <td><b>{p.name}</b>{p.isDemo && <> <span className="badge badge-demo">DÉMO</span></>}</td>
                        <td><Flag code={p.shop.country} size={13} /> {p.shop.name} · {p.shop.city}</td>
                        <td><b>{fmtPrice(p.price, p.currency)}</b></td>
                        <td>{p.images.length}</td>
                        <td>
                          <span className={`badge ${p.isActive ? 'badge-ok' : 'badge-bad'}`}>{p.isActive ? 'VISIBLE' : 'MASQUÉ'}</span>{p.isFeatured && <> <span className="badge badge-ok">VEDETTE</span></>}
                        </td>
                        <td>
                          <div className="act-row">
                            <button className="btn btn-ghost btn-sm" onClick={() => patchProduct(p.id, { isActive: !p.isActive })}>{p.isActive ? 'Masquer' : 'Réafficher'}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => patchProduct(p.id, { isFeatured: !p.isFeatured })}>{p.isFeatured ? 'Retirer vedette' : 'En vedette'}</button>
                            {delProdId === p.id ? (
                              <>
                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => delProduct(p.id)}>Confirmer ?</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setDelProdId(null)}>Non</button>
                              </>
                            ) : (
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => setDelProdId(p.id)}>Supprimer</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      })()}

      {tab === 'commandes' && overview && (() => {
        const q = orderQ.trim().toLowerCase()
        const rows = overview.orders.filter((o) => {
          if (orderFilter !== 'ALL' && o.status !== orderFilter) return false
          if (q && !`${o.product} ${o.shop} ${o.buyerName} ${o.buyerPhone}`.toLowerCase().includes(q)) return false
          return true
        })
        return (
          <>
            <div className="adm-toolbar">
              <div className="field">
                <input type="search" value={orderQ} onChange={(e) => setOrderQ(e.target.value)} placeholder="Rechercher : article, boutique, acheteur…" aria-label="Rechercher une commande" />
              </div>
              <button className={`fchip ${orderFilter === 'ALL' ? 'sel' : ''}`} onClick={() => setOrderFilter('ALL')}>Toutes</button>
              <button className={`fchip ${orderFilter === 'NEW' ? 'sel' : ''}`} onClick={() => setOrderFilter('NEW')}>Nouvelles</button>
              <button className={`fchip ${orderFilter === 'CONFIRMED' ? 'sel' : ''}`} onClick={() => setOrderFilter('CONFIRMED')}>Confirmées</button>
              <button className={`fchip ${orderFilter === 'DELIVERED' ? 'sel' : ''}`} onClick={() => setOrderFilter('DELIVERED')}>Livrées</button>
              <button className={`fchip ${orderFilter === 'CANCELLED' ? 'sel' : ''}`} onClick={() => setOrderFilter('CANCELLED')}>Annulées</button>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucune commande pour ce filtre" sub="Changez le statut ou la recherche." />
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Commande</th><th>Boutique</th><th>Acheteur</th><th>Qté</th><th>Statut</th><th>Date</th><th>Actions régie</th></tr></thead>
                  <tbody>
                    {rows.map((o) => (
                      <tr key={o.id}>
                        <td><b>{o.product}</b>{o.isDemo && <> <span className="badge badge-demo">DÉMO</span></>}</td>
                        <td>{o.shop}</td>
                        <td>{o.buyerName}<br /><span style={{ color: 'var(--muted-ink)', fontSize: '0.78rem' }}>{o.buyerPhone}</span></td>
                        <td>{o.quantity}</td>
                        <td><span className={`badge ${o.status === 'NEW' ? 'badge-wait' : o.status === 'DELIVERED' ? 'badge-ok' : o.status === 'CANCELLED' ? 'badge-bad' : 'badge-ok'}`}>{o.status === 'NEW' ? 'NOUVELLE' : o.status === 'CONFIRMED' ? 'CONFIRMÉE' : o.status === 'DELIVERED' ? 'LIVRÉE' : o.status === 'CANCELLED' ? 'ANNULÉE' : o.status}</span></td>
                        <td>{fmtDateTime(o.createdAt)}</td>
                        <td>
                          <div className="act-row">
                            {o.status === 'NEW' && <button className="btn btn-ghost btn-sm" onClick={() => patchOrder(o.id, 'CONFIRMED')}>Confirmer</button>}
                            {o.status === 'CONFIRMED' && <button className="btn btn-ghost btn-sm" onClick={() => patchOrder(o.id, 'DELIVERED')}>Livrée</button>}
                            {(o.status === 'NEW' || o.status === 'CONFIRMED') && (
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)' }} onClick={() => patchOrder(o.id, 'CANCELLED')}>Annuler</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      })()}

      {tab === 'paiements' && overview && (() => {
        const q = payQ.trim().toLowerCase()
        const rows = overview.payments.filter((p) => !q || `${p.reference} ${p.vendor.name} ${p.vendor.email} ${p.provider ?? ''}`.toLowerCase().includes(q))
        return (
          <>
            <div className="adm-toolbar">
              <div className="field">
                <input type="search" value={payQ} onChange={(e) => setPayQ(e.target.value)} placeholder="Rechercher : référence, vendeur, opérateur…" aria-label="Rechercher un paiement" />
              </div>
              <span className="pd-crumb">{rows.length} paiement{rows.length > 1 ? 's' : ''} · revenus cumulés : <b style={{ color: 'var(--accent-strong)' }}>{fmtPrice(overview.stats.revenue ?? 0, 'XOF')}</b></span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Référence</th><th>Vendeur</th><th>Moyen</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.reference}>
                      <td><b>{p.reference}</b></td>
                      <td>{p.vendor.name}{p.vendor.isDemo && <> <span className="badge badge-demo">DÉMO</span></>}</td>
                      <td>{p.provider ?? p.method}</td>
                      <td><b>{fmtPrice(p.amount, 'XOF')}</b></td>
                      <td><span className="badge badge-ok">{p.status === 'SUCCESS' ? 'Réglé' : p.status}</span></td>
                      <td>{fmtDateTime(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      })()}

      {tab === 'vendeurs' && (() => {
        if (users === null) return <LoadingCards n={4} h={140} />
        const q = userQ.trim().toLowerCase()
        const rows = users.filter((u) => {
          if (userFilter === 'VENDOR' && u.role !== 'VENDOR') return false
          if (userFilter === 'ADMIN' && u.role !== 'ADMIN') return false
          if (q && !`${u.name} ${u.email} ${u.shop?.name ?? ''} ${u.city ?? ''}`.toLowerCase().includes(q)) return false
          return true
        })
        return (
          <>
            <div className="adm-toolbar">
              <div className="field">
                <input type="search" value={userQ} onChange={(e) => setUserQ(e.target.value)} placeholder="Rechercher : nom, e-mail, boutique…" aria-label="Rechercher un vendeur" />
              </div>
              <button className={`fchip ${userFilter === 'ALL' ? 'sel' : ''}`} onClick={() => setUserFilter('ALL')}>Tous ({users.length})</button>
              <button className={`fchip ${userFilter === 'VENDOR' ? 'sel' : ''}`} onClick={() => setUserFilter('VENDOR')}>Vendeurs</button>
              <button className={`fchip ${userFilter === 'ADMIN' ? 'sel' : ''}`} onClick={() => setUserFilter('ADMIN')}>Régie</button>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucun compte pour ce filtre" sub="Changez la recherche ou le rôle." />
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Compte</th><th>Pays · ville</th><th>Rôle</th><th>Boutique</th><th>Lives</th><th>Abonnement</th><th>Inscrit le</th></tr></thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <b>{u.name}</b>{u.isDemo && <> <span className="badge badge-demo">DÉMO</span></>}<br />
                          <span style={{ color: 'var(--muted-ink)', fontSize: '0.78rem' }}>{u.email}{u.phone && <> · {u.phone}</>}</span>
                        </td>
                        <td>
                          {u.country ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flag code={u.country} size={14} /> {COUNTRY_MAP[u.country]?.name}{u.city ? ` · ${u.city}` : ''}</span>
                          ) : (
                            <span style={{ color: 'var(--muted-ink)' }}>—</span>
                          )}
                        </td>
                        <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-live-on' : 'badge-ok'}`}>{u.role === 'ADMIN' ? 'RÉGIE' : 'VENDEUR'}</span></td>
                        <td>
                          {u.shop ? (
                            <button
                              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 700, color: 'var(--accent-text)', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => navigate(`/boutique/${u.shop!.slug}`)}
                            >
                              {u.shop.name}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--muted-ink)' }}>pas encore</span>
                          )}
                          {u.shop && <br />}
                          {u.shop && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted-ink)' }}>
                              {u.shop.productCount} produits · {u.shop.ordersCount} commandes ·{' '}
                              <span className={`badge ${u.shop.isActive ? 'badge-ok' : 'badge-bad'}`} style={{ fontSize: '0.66rem' }}>{u.shop.isActive ? 'VISIBLE' : 'MASQUÉE'}</span>
                            </span>
                          )}
                        </td>
                        <td>{u.livesCount} <span style={{ color: 'var(--muted-ink)', fontSize: '0.78rem' }}>({u.activeLives} validés{u.pendingLives > 0 ? `, ${u.pendingLives} en attente` : ''})</span></td>
                        <td>
                          {u.subscription ? (
                            <span className="badge badge-ok">ACTIF → {fmtDateTime(u.subscription.endDate)}</span>
                          ) : (
                            <span className="badge badge-bad">AUCUN</span>
                          )}
                        </td>
                        <td>{fmtDateTime(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      })()}
    </main>
  )
}

function OverviewTab({ o }: { o: Overview | null }) {
  const { navigate } = useApp()
  if (o === null) return <LoadingCards n={4} h={100} />
  const s = o.stats
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="stat-grid">
        <div className="stat-card"><span className="sc-lbl">À valider</span><span className="sc-val" style={{ color: 'var(--wait)' }}>{s.pending}</span><span className="sc-sub">demandes en attente</span></div>
        <div className="stat-card"><span className="sc-lbl">En direct</span><span className="sc-val on">{s.liveNow}</span><span className="sc-sub">+ {s.upcoming} à venir aujourd&apos;hui</span></div>
        <div className="stat-card"><span className="sc-lbl">Boutiques</span><span className="sc-val">{s.shops}</span><span className="sc-sub">{s.products} produits en ligne</span></div>
        <div className="stat-card"><span className="sc-lbl">Comptes</span><span className="sc-val">{s.usersTotal ?? '—'}</span><span className="sc-sub">{s.vendors} vendeurs réels</span></div>
        <div className="stat-card"><span className="sc-lbl">Abonnements actifs</span><span className="sc-val on">{s.activeSubscriptions}</span><span className="sc-sub">revenus : {fmtPrice(s.revenue ?? 0, 'XOF')}</span></div>
        <div className="stat-card"><span className="sc-lbl">Commandes</span><span className="sc-val">{s.orders}</span><span className="sc-sub">toutes boutiques</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        <div className="review-card">
          <b>Par pays</b>
          <div className="review-rows" style={{ marginTop: 8 }}>
            {o.byCountry.map((c) => (
              <span key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flag code={c.code} size={15} />
                {COUNTRY_MAP[c.code]?.name} : <b>{c.enDirect} en direct · {c.boutiques} boutiques</b>
              </span>
            ))}
          </div>
        </div>
        <div className="review-card">
          <b>Lives validés par catégorie</b>
          <div className="review-rows" style={{ marginTop: 8 }}>
            {o.byCategory.map((c) => (
              <span key={c.id}>{CATEGORY_MAP[c.id]?.label ?? c.id} : <b>{c.count}</b></span>
            ))}
          </div>
        </div>
        <div className="review-card">
          <b>Activité récente</b>
          <div className="recent-feed" style={{ marginTop: 8 }}>
            {(o.recentLives ?? []).slice(0, 6).map((l) => (
              <span key={l.id}>
                <Flag code={l.country} size={13} />
                <b>{l.displayName}</b> — {l.vendorName}
                <span className={`badge ${l.status === 'PENDING' ? 'badge-wait' : l.status === 'VALIDATED' ? 'badge-ok' : 'badge-bad'}`} style={{ fontSize: '0.64rem' }}>
                  {l.status === 'PENDING' ? 'EN ATTENTE' : l.status === 'VALIDATED' ? 'VALIDÉ' : l.status === 'REJECTED' ? 'REFUSÉ' : 'TERMINÉ'}
                </span>
                <span style={{ fontSize: '0.74rem' }}>{fmtDateTime(l.createdAt)}</span>
              </span>
            ))}
            {(o.recentLives ?? []).length === 0 && <span>Aucun live soumis récemment.</span>}
          </div>
        </div>
      </div>

      <div className="review-actions" style={{ paddingTop: 0 }}>
        <button className="btn btn-site" onClick={() => navigate('/regie')}>File de validation complète →</button>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>Voir le site public</button>
      </div>
    </div>
  )
}

function ReviewCard({
  l, busy, act, refuseId, setRefuseId, reason, setReason, pending,
}: {
  l: AdminLive
  busy: boolean
  act: (id: string, action: 'accept' | 'refuse' | 'end', reason?: string) => void
  refuseId: string | null
  setRefuseId: (v: string | null) => void
  reason: string
  setReason: (v: string) => void
  pending?: boolean
}) {
  const runtimeBadge = () => {
    if (l.status === 'PENDING') return <span className="badge badge-wait">À VALIDER</span>
    if (l.status === 'REJECTED') return <span className="badge badge-bad">REFUSÉ</span>
    if (l.status === 'ENDED' || l.status === 'EXPIRED') return <span className="badge">TERMINÉ</span>
    if (l.runtimeStatus === 'LIVE') return <span className="badge badge-live-on"><span className="dot" />EN DIRECT — {l.startsAtLabel}</span>
    if (l.runtimeStatus === 'UPCOMING_TODAY') return <span className="badge badge-ok">VALIDÉ · {l.startsAtLabel}</span>
    return <span className="badge">VALIDÉ · créneau terminé</span>
  }
  return (
    <article className={`review-card ${pending ? 'is-pending' : ''}`}>
      <div className="review-top">
        <div>
          <b style={{ fontSize: '1.06rem' }}>{l.displayName}</b>
          <div className="lc-meta" style={{ marginTop: 4 }}>
            <Flag code={l.country} size={15} />
            {COUNTRY_MAP[l.country]?.name} · {CATEGORY_MAP[l.category]?.label ?? l.category}
            {l.shop && <>· boutique {l.shop.name}</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {runtimeBadge()}
          {(l.isDemo || l.isDemoVendor) && <span className="badge badge-demo">DÉMO</span>}
        </div>
      </div>
      <div className="review-rows">
        <span>Vendeur : <b>{l.vendorName}</b> — {l.vendorEmail}{l.vendorPhone && <> · {l.vendorPhone}</>}</span>
        <span>Créneau : <b>{l.slot === 'MATIN' ? 'Matin 08h–11h' : 'Soir 18h–21h'}</b> · {l.mode === 'presentiel' ? 'présentiel (régie OCD)' : 'à distance'}{l.scheduledDate ? ` · prévu ${fmtDateTime(l.scheduledDate)}` : ''} · soumis le {fmtDateTime(l.createdAt)}</span>
        {l.liveUrl ? (
          <span>Lien : <a href={l.liveUrl} target="_blank" rel="noopener" style={{ fontWeight: 700, wordBreak: 'break-all' }}>{l.liveUrl}</a></span>
        ) : (
          <span>Lien : <b>aucun — live en présentiel à la régie</b></span>
        )}
        {l.rejectionReason && <span style={{ display: 'block' }}>Motif de refus : « {l.rejectionReason} »</span>}
      </div>
      <div className="review-actions">
        {l.liveUrl && (
          <a className="btn btn-ghost btn-sm" href={l.liveUrl} target="_blank" rel="noopener">
            Ouvrir le live ↗
          </a>
        )}
        {l.status === 'PENDING' && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => act(l.id, 'accept')} disabled={busy}>Accepter</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--bad)', borderColor: 'var(--bad)' }} onClick={() => setRefuseId(refuseId === l.id ? null : l.id)} disabled={busy}>
              Refuser…
            </button>
          </>
        )}
        {l.status === 'VALIDATED' && (
          <button className="btn btn-ghost btn-sm" onClick={() => act(l.id, 'end')} disabled={busy}>Terminer le créneau</button>
        )}
      </div>
      {refuseId === l.id && (
        <div className="field" style={{ marginTop: 6 }}>
          <label htmlFor={`rf-${l.id}`}>Motif du refus <b>*</b> <small>(envoyé au vendeur)</small></label>
          <input id={`rf-${l.id}`} type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex. lien invalide / le live ne montre aucune vente" autoFocus />
          <p className="ferr" />
          <div className="review-actions" style={{ marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={() => act(l.id, 'refuse', reason)} disabled={busy || reason.trim().length < 3}>Envoyer le refus</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setRefuseId(null)}>Annuler</button>
          </div>
        </div>
      )}
    </article>
  )
}
