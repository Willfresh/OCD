'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useApp, api, fmtPrice, norm } from './store'
import { LoadingCards, EmptyState, shareLink } from './chrome'
import { Flag } from './Flag'
import { CatIcon, WhatsAppIcon } from './icons'
import { CATEGORIES, COUNTRIES, COUNTRY_MAP, CATEGORY_MAP } from '@/lib/ocd/constants'

export interface PublicProduct {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  categoryLabel: string
  images: string[]
  isDemo: boolean
  shop: {
    id: string
    name: string
    slug: string
    city: string
    country: string
    logoUrl: string | null
    isDemo: boolean
    isLiveNow: boolean
    liveSlot: string | null
    whatsapp: string | null
  }
}

export interface PublicShop {
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
  productCount: number
  isDemo: boolean
  isLiveNow: boolean
  liveSlot: string | null
}

/* ---------- Articles « vus récemment » (mémoire locale du visiteur) ----------
   Pratique sur mobile : on retrouve un article consulté sans le rechercher. */
interface ViewedItem {
  id: string
  name: string
  price: number
  currency: string
  img: string | null
  shopName: string
  shopSlug: string
}
const VIEWED_KEY = 'ocd-viewed'
function getViewed(): ViewedItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]')
    return Array.isArray(v) ? v.slice(0, 8) : []
  } catch {
    return []
  }
}
function rememberViewed(p: DetailProduct | PublicProduct) {
  try {
    const item: ViewedItem = {
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      img: p.images?.[0] ?? null,
      shopName: p.shop.name,
      shopSlug: p.shop.slug,
    }
    const cur = getViewed().filter((x) => x.id !== p.id)
    localStorage.setItem(VIEWED_KEY, JSON.stringify([item, ...cur].slice(0, 8)))
  } catch {
    /* stockage indisponible : sans conséquence */
  }
}

export function OrderModal({
  product,
  onClose,
}: {
  product: PublicProduct
  onClose: () => void
}) {
  const { toast } = useApp()
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', buyerCountry: '', quantity: 1, message: '' })
  const [err, setErr] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ ref: string; wa: string | null } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (form.buyerName.trim().length < 2) return setErr('Indiquez votre nom.')
    if (form.buyerPhone.replace(/\D/g, '').length < 8) return setErr('Indiquez un numéro de téléphone valide.')
    setSending(true)
    try {
      const d = await api<{ order: { id: string }; shopWhatsapp: string | null }>('/api/orders', {
        method: 'POST',
        body: { productId: product.id, ...form },
      })
      setDone({ ref: d.order.id.slice(-8).toUpperCase(), wa: d.shopWhatsapp })
      toast('Commande envoyée au vendeur !', 'ok')
    } catch (ex) {
      setErr((ex as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-label={`Commander ${product.name}`}>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-panel">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        {done ? (
          <div className="rz-final" style={{ paddingTop: 10 }}>
            <div className="final-check">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: 6 }}>Commande envoyée&nbsp;!</h3>
            <p className="final-sub">
              {product.shop.name} a reçu votre commande et vous contactera sur votre téléphone.
              Référence&nbsp;: <strong>OCD-{done.ref}</strong>
            </p>
            <div className="final-actions" style={{ marginTop: 18 }}>
              {done.wa && (
                <a
                  className="btn btn-primary"
                  href={`https://wa.me/${done.wa.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Bonjour, je viens de commander « ${product.name} » sur OCD Shop (réf OCD-${done.ref}).`,
                  )}`}
                  target="_blank"
                  rel="noopener"
                >
                  <WhatsAppIcon size={17} /> Discuter sur WhatsApp
                </a>
              )}
              <button className="btn btn-ghost" onClick={onClose}>Fermer</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="m-mode"><span className="pulse-dot" />Commander sur OCD Shop</p>
            <h3 className="m-title">{product.name}</h3>
            <p className="m-pkg">
              {fmtPrice(product.price, product.currency)} · {product.shop.name} · {product.shop.city}
            </p>
            <div className="fgrid">
              <div className="field">
                <label htmlFor="o-name">Votre nom <b>*</b></label>
                <input id="o-name" type="text" value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} placeholder="Ex. Aïcha Diallo" />
                <p className="ferr">Votre nom est requis.</p>
              </div>
              <div className="field">
                <label htmlFor="o-phone">Votre téléphone <b>*</b></label>
                <input id="o-phone" type="tel" inputMode="tel" value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} placeholder="+229 90 12 34 56" />
                <p className="ferr">Numéro invalide.</p>
              </div>
              <div className="field">
                <label htmlFor="o-country">Votre pays</label>
                <select id="o-country" value={form.buyerCountry} onChange={(e) => setForm({ ...form, buyerCountry: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="o-qty">Quantité</label>
                <input
                  id="o-qty"
                  type="number"
                  min={1}
                  max={99}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
                />
              </div>
              <div className="field f-full">
                <label htmlFor="o-msg">Message <small>(facultatif)</small></label>
                <textarea id="o-msg" rows={2} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Précisions, livraison, couleur…" />
              </div>
            </div>
            {err && <p className="error-note" style={{ marginTop: 12 }}>{err}</p>}
            <div className="m-actions">
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending && <span className="spinner" />}
                Envoyer la commande
              </button>
              <button className="btn btn-ghost" type="button" onClick={onClose}>Annuler</button>
            </div>
            <p className="m-note">
              La commande va directement au vendeur ({product.shop.name}) — il vous appellera sur WhatsApp.
              Aucun paiement en ligne n&apos;est demandé ici.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export function ProductCard({
  p,
  onOrder,
  onShop,
  onDetail,
}: {
  p: PublicProduct
  onOrder: (p: PublicProduct) => void
  onShop: (slug: string) => void
  onDetail: (id: string) => void
}) {
  return (
    <article className="product-card">
      <button className="pc-photo" type="button" onClick={() => onDetail(p.id)} aria-label={`Voir le détail de ${p.name}`} title="Voir le détail">
        {p.images[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <div className="ph" style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--icon-bg)', color: 'var(--accent-strong)', fontWeight: 900 }}>OCD</div>}
        <div className="lc-overlay">
          {p.shop.isLiveNow && <span className="badge badge-live-on"><span className="dot" />Vendeur en direct</span>}
          {p.isDemo && <span className="badge badge-demo">DÉMO</span>}
          {p.images.length > 1 && <span className="pc-icnt">+{p.images.length}</span>}
        </div>
        <span className="pc-view">Voir le détail →</span>
      </button>
      <div className="pc-body">
        <button className="pc-name-btn" type="button" onClick={() => onDetail(p.id)}>
          <span className="pc-name">{p.name}</span>
        </button>
        <span className="pc-price">{fmtPrice(p.price, p.currency)}</span>
        <button className="pc-shop" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }} onClick={() => onShop(p.shop.slug)}>
          {p.shop.country && <Flag code={p.shop.country} size={16} />}
          <span style={{ textDecoration: 'underline', textDecorationStyle: 'dotted' }}>{p.shop.name}</span> · {p.shop.city}
        </button>
        <div className="pc-actions">
          <button className="btn btn-primary" onClick={() => onOrder(p)}>Commander</button>
        </div>
      </div>
    </article>
  )
}

export function ShopView() {
  const { route, navigate } = useApp()
  const [tab, setTab] = useState<'produits' | 'boutiques'>(route.query.get('vue') === 'boutiques' ? 'boutiques' : 'produits')
  const [products, setProducts] = useState<PublicProduct[] | null>(null)
  const [shops, setShops] = useState<PublicShop[] | null>(null)
  const [q, setQ] = useState(route.query.get('q') ?? '')
  const [country, setCountry] = useState(route.query.get('country') ?? '')
  const [category, setCategory] = useState(route.query.get('category') ?? '')
  const [sort, setSort] = useState(route.query.get('tri') ?? '')
  const [liveOnly, setLiveOnly] = useState(false)
  const [viewed, setViewed] = useState<ViewedItem[]>([])
  const [order, setOrder] = useState<PublicProduct | null>(null)

  // Articles vus récemment (mémoire locale — pratique pour retrouver un article).
  // Lecture différée d'un tick : évite un setState synchrone dans l'effet.
  useEffect(() => {
    const t = setTimeout(() => setViewed(getViewed()), 0)
    return () => clearTimeout(t)
  }, [])

  // Produits : pays + catégorie + tri côté serveur. La recherche reste locale
  // (voir `shown` ci-dessous) pour être insensible aux accents sur toutes les bases.
  useEffect(() => {
    const qs = new URLSearchParams()
    if (country) qs.set('country', country)
    if (category) qs.set('category', category)
    if (sort) qs.set('sort', sort)
    const t = setTimeout(() => {
      api<{ products: PublicProduct[] }>(`/api/products?${qs}`)
        .then((d) => setProducts(d.products))
        .catch(() => setProducts([]))
    }, 250)
    return () => clearTimeout(t)
  }, [country, category, sort])

  useEffect(() => {
    if (tab !== 'boutiques') return
    const qs = new URLSearchParams()
    if (country) qs.set('country', country)
    if (category) qs.set('category', category)
    api<{ shops: PublicShop[] }>(`/api/shops?${qs}`)
      .then((d) => setShops(d.shops))
      .catch(() => setShops([]))
  }, [tab, country, category])

  // Filtres mémorisés dans l'URL (#/shop?q=robe&country=BJ&tri=price-asc…)
  // → lien partageable, « retour » navigateur conservé, sans recharger la page.
  useEffect(() => {
    const qs = new URLSearchParams()
    if (q.trim()) qs.set('q', q.trim())
    if (country) qs.set('country', country)
    if (category) qs.set('category', category)
    if (sort) qs.set('tri', sort)
    if (tab === 'boutiques') qs.set('vue', 'boutiques')
    const s = qs.toString()
    history.replaceState(null, '', window.location.pathname + (s ? `#/shop?${s}` : '#/shop'))
  }, [q, country, category, sort, tab])

  // Recherche locale (casse + accents ignorés) : article, description, catégorie,
  // boutique, ville, pays. Tri et filtres pays/catégorie restent côté serveur.
  const shown = useMemo(() => {
    const needle = norm(q.trim())
    if (!needle) return products ?? []
    return (products ?? []).filter((p) =>
      norm(
        [
          p.name,
          p.description,
          p.categoryLabel,
          p.shop.name,
          p.shop.city,
          COUNTRY_MAP[p.shop.country]?.name ?? '',
        ].join(' '),
      ).includes(needle),
    )
  }, [products, q])

  const shownShops = useMemo(() => {
    const needle = norm(q.trim())
    const list = (shops ?? []).filter((s) => !liveOnly || s.isLiveNow)
    if (!needle) return list
    return list.filter((s) =>
      norm(
        [
          s.name,
          s.description,
          s.city,
          CATEGORY_MAP[s.category]?.label ?? '',
          COUNTRY_MAP[s.country]?.name ?? '',
        ].join(' '),
      ).includes(needle),
    )
  }, [shops, liveOnly, q])

  const filtersActive = q.trim() !== '' || country !== '' || category !== '' || sort !== '' || liveOnly
  const resetFilters = () => {
    setQ('')
    setCountry('')
    setCategory('')
    setSort('')
    setLiveOnly(false)
  }

  return (
    <main className="section" style={{ paddingTop: 120, paddingBottom: 60 }}>
      <p className="eyebrow">OCD Shop — la marketplace africaine</p>
      <h1 className="sec-title">Découvrez, commandez, contactez</h1>
      <p className="sec-sub">
        Chaque produit appartient à une vraie boutique vérifiée. Commandez en ligne ou discutez directement avec le
        vendeur sur WhatsApp — y compris pendant son live.
      </p>

      <div className="dash-tabs" style={{ marginTop: 26 }}>
        <button className={`dash-tab ${tab === 'produits' ? 'sel' : ''}`} onClick={() => setTab('produits')}>Produits</button>
        <button className={`dash-tab ${tab === 'boutiques' ? 'sel' : ''}`} onClick={() => setTab('boutiques')}>Boutiques</button>
      </div>

      {/* Recherche + filtres + tri */}
      <div className="fgrid" style={{ gridTemplateColumns: tab === 'produits' ? '1fr 200px 210px' : '1fr 200px', alignItems: 'start', marginTop: 26 }}>
        <div className="field">
          <label htmlFor="s-q">Rechercher un article ou une boutique</label>
          <input
            id="s-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex. robe wax, poulet braisé, savon noir…"
            autoComplete="off"
          />
        </div>
        <div className="field">
          <label htmlFor="s-country">Pays</label>
          <select id="s-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">Tous les pays</option>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        {tab === 'produits' && (
          <div className="field">
            <label htmlFor="s-sort">Trier par</label>
            <select id="s-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Recommandés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="newest">Nouveautés</option>
              <option value="name">Nom (A → Z)</option>
            </select>
          </div>
        )}
      </div>
      <div className="cat-chips" style={{ marginTop: 14 }}>
        <button className={`cat-chip ${!category ? 'sel' : ''}`} onClick={() => setCategory('')}>Toutes catégories</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={`cat-chip ${category === c.id ? 'sel' : ''}`} onClick={() => setCategory(category === c.id ? '' : c.id)}>
            <CatIcon id={c.icon} size={15} />
            {c.label}
          </button>
        ))}
      </div>

      {/* Compteur de résultats + réinitialisation */}
      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="badge" style={{ textTransform: 'none', letterSpacing: 0 }}>
          {tab === 'produits'
            ? products === null
              ? '…'
              : `${shown.length} article${shown.length > 1 ? 's' : ''}${q.trim() ? ` pour « ${q.trim()} »` : ''}`
            : shops === null
              ? '…'
              : `${shownShops.length} boutique${shownShops.length > 1 ? 's' : ''}${q.trim() ? ` pour « ${q.trim()} »` : ''}`}
        </span>
        {filtersActive && (
          <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
            ✕ Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Articles vus récemment — mémoire locale du visiteur */}
      {tab === 'produits' && viewed.length > 0 && (
        <div className="rv-block">
          <h2 className="rv-title">Vus récemment — reprenez où vous étiez</h2>
          <div className="rv-row">
            {viewed.map((v) => (
              <button key={v.id} type="button" className="rv-card" onClick={() => navigate(`/article/${v.id}`)} title={v.name}>
                {v.img ? (
                  <img src={v.img} alt={v.name} loading="lazy" />
                ) : (
                  <span className="rv-ph">OCD</span>
                )}
                <span className="rv-txt">
                  <b>{v.name}</b>
                  <small>{fmtPrice(v.price, v.currency)} · {v.shopName}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'produits' ? (
        products === null ? (
          <div style={{ marginTop: 26 }}><LoadingCards n={8} h={320} /></div>
        ) : shown.length === 0 ? (
          <div style={{ marginTop: 26 }}>
            <EmptyState
              title={q.trim() ? `Aucun article ne correspond à « ${q.trim()} »` : 'Aucun produit trouvé'}
              sub={
                q.trim()
                  ? 'Vérifiez l\u2019orthographe ou effacez la recherche pour voir tous les articles.'
                  : 'Modifiez la recherche ou les filtres, ou explorez toutes les boutiques.'
              }
              action={
                filtersActive ? (
                  <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={resetFilters}>Réinitialiser les filtres</button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="product-grid" style={{ marginTop: 26 }}>
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} onOrder={setOrder} onShop={(slug) => navigate(`/boutique/${slug}`)} onDetail={(id) => navigate(`/article/${id}`)} />
            ))}
          </div>
        )
      ) : (
        <>
          {/* Filtre « en direct » : les boutiques dont le vendeur diffuse en ce moment */}
          <div className="cat-chips" style={{ marginTop: 18 }}>
            <button
              type="button"
              className={`cat-chip ${liveOnly ? 'sel' : ''}`}
              onClick={() => setLiveOnly((v) => !v)}
              aria-pressed={liveOnly}
            >
              <span className="pulse-dot" style={{ width: 7, height: 7 }} aria-hidden="true" />
              En direct maintenant
            </button>
          </div>
          {shops === null ? (
            <div style={{ marginTop: 20 }}><LoadingCards n={6} h={320} /></div>
          ) : shownShops.length === 0 ? (
            <div style={{ marginTop: 20 }}>
              <EmptyState
                title={
                  q.trim()
                    ? `Aucune boutique ne correspond à « ${q.trim()} »`
                    : liveOnly
                      ? 'Aucune boutique en direct pour le moment'
                      : 'Aucune boutique trouvée'
                }
                sub={
                  q.trim()
                    ? 'Vérifiez l\u2019orthographe ou effacez la recherche pour voir toutes les boutiques.'
                    : liveOnly
                      ? 'Les boutiques en direct apparaissent pendant les créneaux (08h–11h et 18h–21h). Revenez au prochain créneau !'
                      : "Modifiez les filtres pour découvrir d'autres commerces."
                }
                action={
                  filtersActive ? (
                    <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={resetFilters}>Réinitialiser les filtres</button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="shop-grid" style={{ marginTop: 20 }}>
              {shownShops.map((s) => (
            <button key={s.id} className="shop-card" onClick={() => navigate(`/boutique/${s.slug}`)}>
              <div className="sc-banner">
                {s.bannerUrl ? <img src={s.bannerUrl} alt={s.name} loading="lazy" /> : <div style={{ width: '100%', height: '100%', background: 'var(--icon-bg)' }} />}
                <div className="lc-overlay">
                  {s.isLiveNow && <span className="badge badge-live-on"><span className="dot" />EN DIRECT</span>}
                  {s.isDemo && <span className="badge badge-demo">DÉMO</span>}
                </div>
              </div>
              <div className="sc-body">
                {s.logoUrl ? <img className="sc-logo" src={s.logoUrl} alt="" /> : <span className="sc-logo" style={{ display: 'grid', placeItems: 'center', fontWeight: 900, color: 'var(--accent-strong)' }}>{s.name.slice(0, 2).toUpperCase()}</span>}
                <span className="sc-txt">
                  <span className="sc-name">{s.name}</span>
                  <span className="sc-meta">
                    <Flag code={s.country} size={15} />
                    {COUNTRY_MAP[s.country]?.name} · {s.city}
                  </span>
                  <span className="sc-meta">{CATEGORY_MAP[s.category]?.label ?? s.category} · {s.productCount} produit{s.productCount > 1 ? 's' : ''}</span>
                </span>
              </div>
            </button>
          ))}
            </div>
          )}
        </>
      )}

      {order && <OrderModal product={order} onClose={() => setOrder(null)} />}
    </main>
  )
}

export function ShopDetailView({ slug }: { slug: string }) {
  const { navigate } = useApp()
  // Données chargées + slug associé : « en chargement » = rien chargé OU slug différent
  const [data, setData] = useState<{ slug: string; shop: PublicShop | null; products: PublicProduct[] } | null>(null)
  const [order, setOrder] = useState<PublicProduct | null>(null)
  // Tri des articles de la boutique : prix croissant/décroissant, nouveautés, nom
  const [sort, setSort] = useState('')

  // Chargement de la fiche boutique
  useEffect(() => {
    let alive = true
    api<{ shops: PublicShop[] }>('/api/shops?q=')
      .then((d) => {
        if (!alive) return
        const s = d.shops.find((x) => x.slug === slug)
        setData({ slug, shop: s ?? null, products: [] })
      })
      .catch(() => alive && setData({ slug, shop: null, products: [] }))
    return () => {
      alive = false
    }
  }, [slug])

  // Chargement des articles — relancé quand le tri change
  const shopId = data?.shop?.id
  useEffect(() => {
    if (!shopId || data?.slug !== slug) return
    let alive = true
    const qs = new URLSearchParams({ shopId })
    if (sort) qs.set('sort', sort)
    api<{ products: PublicProduct[] }>(`/api/products?${qs}`)
      .then((dp) => alive && setData((cur) => (cur && cur.slug === slug ? { ...cur, products: dp.products } : cur)))
      .catch(() => alive && setData((cur) => (cur && cur.slug === slug ? { ...cur, products: [] } : cur)))
    return () => {
      alive = false
    }
  }, [shopId, sort, slug, data?.slug])

  if (!data || data.slug !== slug) {
    return <main className="section" style={{ paddingTop: 120 }}><LoadingCards n={4} h={240} /></main>
  }
  const shop = data.shop
  const products = data.products
  if (!shop) {
    return (
      <main className="section" style={{ paddingTop: 120 }}>
        <EmptyState title="Boutique introuvable" sub="Elle a peut-être été désactivée." action={<button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/shop')}>Retour à OCD Shop</button>} />
      </main>
    )
  }

  const wa = shop.whatsapp?.replace(/\D/g, '')
  return (
    <main>
      <div style={{ position: 'relative', background: 'var(--bg-2)' }}>
        {shop.bannerUrl && (
          <img src={shop.bannerUrl} alt="" style={{ width: '100%', height: 260, objectFit: 'cover', opacity: 0.5 }} />
        )}
        <div className="section" style={{ paddingBlock: shop.bannerUrl ? 0 : 48, position: 'relative' }}>
          <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: shop.bannerUrl ? -70 : 0 }}>
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} style={{ width: 108, height: 108, borderRadius: 26, border: '3px solid var(--bg)', objectFit: 'cover', background: 'var(--card)' }} />
            ) : (
              <span style={{ width: 108, height: 108, borderRadius: 26, border: '3px solid var(--bg)', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: '2rem', color: 'var(--accent-strong)', background: 'var(--icon-bg)' }}>
                {shop.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <h1 className="sec-title" style={{ marginBottom: 8 }}>{shop.name}</h1>
                {shop.isLiveNow && <span className="badge badge-live-on"><span className="dot" />VENDEUR EN DIRECT — {shop.liveSlot === 'MATIN' ? '08h–11h' : '18h–21h'}</span>}
                {shop.isDemo && <span className="badge badge-demo">DÉMO</span>}
              </div>
              <p className="sc-meta" style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted-ink)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Flag code={shop.country} size={17} />
                {COUNTRY_MAP[shop.country]?.name} · {shop.city} · {CATEGORY_MAP[shop.category]?.label}
              </p>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {wa && (
                <a className="btn btn-primary" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${shop.name}, je vous contacte depuis OCD Shop.`)}`} target="_blank" rel="noopener">
                  <WhatsAppIcon size={17} /> Contacter le vendeur
                </a>
              )}
              <button className="btn btn-ghost" onClick={() => navigate('/shop')}>← Toutes les boutiques</button>
            </div>
          </div>
        </div>
      </div>
      <div className="section" style={{ paddingTop: 30 }}>
        {shop.description && <p className="sec-sub" style={{ marginBottom: 30 }}>{shop.description}</p>}
        {products.length === 0 ? (
          <EmptyState title="Cette boutique n'a pas encore de produit" sub="Revenez bientôt — les nouveautés arrivent." />
        ) : (
          <>
            {/* Tri des articles de la boutique */}
            <div className="fgrid" style={{ gridTemplateColumns: '220px 1fr', alignItems: 'center', marginBottom: 18 }}>
              <div className="field">
                <label htmlFor="sd-sort">Trier les articles</label>
                <select id="sd-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="">Recommandés</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="newest">Nouveautés</option>
                  <option value="name">Nom (A → Z)</option>
                </select>
              </div>
              <p style={{ justifySelf: 'end', fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted-ink)' }}>
                {products.length} article{products.length > 1 ? 's' : ''} en vente
              </p>
            </div>
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} onOrder={setOrder} onShop={() => {}} onDetail={(id) => navigate(`/article/${id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
      {order && <OrderModal product={order} onClose={() => setOrder(null)} />}
    </main>
  )
}

/* ===================== Détail d'un article — galerie multi-photos ===================== */
interface DetailProduct extends PublicProduct {
  isFeatured: boolean
  createdAt: string
  shop: PublicProduct['shop'] & { description: string; bannerUrl: string | null }
}

export function ProductDetailView({ id }: { id: string }) {
  const { navigate, toast } = useApp()
  const [data, setData] = useState<{ id: string; product: DetailProduct | null; related: PublicProduct[] } | null>(null)
  const [idx, setIdx] = useState(0)
  const [order, setOrder] = useState<PublicProduct | null>(null)

  // Changement d'article : réinitialisation pendant le rendu (pattern React officiel)
  const [lastId, setLastId] = useState(id)
  if (lastId !== id) {
    setLastId(id)
    setIdx(0)
    setData(null)
  }

  useEffect(() => {
    let alive = true
    api<{ product: DetailProduct | null }>(`/api/products?id=${encodeURIComponent(id)}`)
      .then((d) => {
        if (!alive) return
        setData({ id, product: d.product, related: [] })
        if (d.product) rememberViewed(d.product)
        return api<{ products: PublicProduct[] }>(`/api/products?shopId=${d.product?.shop.id}`).then((dp) => {
          if (!alive) return
          setData((cur) => (cur && cur.id === id ? { ...cur, related: dp.products.filter((p) => p.id !== id).slice(0, 8) } : cur))
        })
      })
      .catch(() => alive && setData({ id, product: null, related: [] }))
    return () => {
      alive = false
    }
  }, [id])

  if (!data || data.id !== id) {
    return (
      <main className="section" style={{ paddingTop: 120 }}>
        <LoadingCards n={2} h={300} />
      </main>
    )
  }
  const p = data.product
  if (!p) {
    return (
      <main className="section" style={{ paddingTop: 120 }}>
        <EmptyState
          title="Article introuvable"
          sub="Il a peut-être été retiré par le vendeur ou par la régie."
          action={<button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => navigate('/shop')}>Retour à OCD Shop</button>}
        />
      </main>
    )
  }

  const imgs = p.images.length > 0 ? p.images : []
  const wa = p.shop.whatsapp?.replace(/\D/g, '')
  const prev = () => setIdx((i) => (imgs.length ? (i - 1 + imgs.length) % imgs.length : 0))
  const next = () => setIdx((i) => (imgs.length ? (i + 1) % imgs.length : 0))

  return (
    <main className="section" style={{ paddingTop: 110, paddingBottom: 60 }}>
      <div className="pd-back">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/shop')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
          OCD Shop
        </button>
        <span className="pd-crumb">
          {p.shop.name} <b>›</b> {p.categoryLabel}
        </span>
      </div>

      <div className="pd-grid">
        {/* Galerie : grande photo + miniatures + flèches */}
        <div className="pd-gallery">
          <div className="pd-main">
            {imgs.length > 0 ? (
              <img key={`${id}-${idx}`} src={imgs[idx]} alt={`${p.name} — photo ${idx + 1}/${imgs.length}`} />
            ) : (
              <div className="pd-empty-ph">OCD</div>
            )}
            {imgs.length > 1 && (
              <>
                <button className="pd-nav pd-prev" type="button" onClick={prev} aria-label="Photo précédente">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button className="pd-nav pd-next" type="button" onClick={next} aria-label="Photo suivante">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <span className="pd-counter">{idx + 1} / {imgs.length}</span>
              </>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="pd-thumbs" role="tablist" aria-label="Photos de l'article">
              {imgs.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  role="tab"
                  className={`pd-thumb ${i === idx ? 'sel' : ''}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-selected={i === idx}
                >
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations + actions */}
        <div className="pd-info">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge"><CatIcon id={CATEGORY_MAP[p.category]?.icon ?? 'store'} size={13} /> {p.categoryLabel}</span>
            {p.isFeatured && <span className="badge badge-ok">EN VEDETTE</span>}
            {p.isDemo && <span className="badge badge-demo">DÉMO</span>}
          </div>
          <h1 className="sec-title" style={{ fontSize: 'clamp(1.5rem,3.2vw,2.1rem)', marginTop: 12 }}>{p.name}</h1>
          <p className="pd-price">{fmtPrice(p.price, p.currency)}</p>
          {p.description && <p className="pd-desc">{p.description}</p>}

          {/* Carte boutique */}
          <button className="pd-shop" type="button" onClick={() => navigate(`/boutique/${p.shop.slug}`)} title="Voir la boutique">
            {p.shop.logoUrl ? <img src={p.shop.logoUrl} alt="" /> : <span className="pd-shop-init">{p.shop.name.slice(0, 2).toUpperCase()}</span>}
            <span className="pd-shop-txt">
              <b>{p.shop.name}</b>
              <span className="lc-meta">
                {p.shop.country && <Flag code={p.shop.country} size={14} />}
                {COUNTRY_MAP[p.shop.country]?.name} · {p.shop.city}
              </span>
            </span>
            {p.shop.isLiveNow && <span className="badge badge-live-on"><span className="dot" />EN DIRECT</span>}
          </button>

          <div className="pd-actions">
            <button className="btn btn-primary" onClick={() => setOrder(p)}>Commander cet article</button>
            {wa && (
              <a
                className="btn btn-site"
                href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par « ${p.name} » (${fmtPrice(p.price, p.currency)}) vu sur OCD Shop.`)}`}
                target="_blank"
                rel="noopener"
              >
                <WhatsAppIcon size={17} /> Contacter le vendeur
              </a>
            )}
            <button className="btn btn-ghost" onClick={() => navigate(`/boutique/${p.shop.slug}`)}>Voir la boutique</button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => shareLink(`OCD Shop — ${p.name}`, `« ${p.name} » à ${fmtPrice(p.price, p.currency)} sur OCD Shop`, toast)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Partager
            </button>
          </div>
          <p className="m-note" style={{ marginTop: 4 }}>
            Le vendeur vous répond sur WhatsApp — paiement à la livraison ou Mobile Money selon la boutique.
          </p>
        </div>
      </div>

      {/* Autres articles de la même boutique */}
      {data.related.length > 0 && (
        <div style={{ marginTop: 44 }}>
          <h2 className="sec-title" style={{ fontSize: '1.25rem' }}>Autres articles de {p.shop.name}</h2>
          <div className="product-grid" style={{ marginTop: 16 }}>
            {data.related.map((r) => (
              <ProductCard key={r.id} p={r} onOrder={setOrder} onShop={() => {}} onDetail={(pid) => navigate(`/article/${pid}`)} />
            ))}
          </div>
        </div>
      )}

      {order && <OrderModal product={order} onClose={() => setOrder(null)} />}
    </main>
  )
}
