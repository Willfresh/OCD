'use client'

import React, { useEffect, useState } from 'react'
import { useApp, api, fmtPrice } from './store'
import { GlobeCanvas } from './globe'
import { Marquee, LoadingCards, EmptyState } from './chrome'
import { Flag } from './Flag'
import { CatIcon } from './icons'
import { COUNTRY_MAP } from '@/lib/ocd/constants'

export function HomeView() {
  const { navigate, stats, refreshStats } = useApp()
  const [products, setProducts] = useState<{ id: string; name: string; price: number; currency: string; images: string[]; shop: { name: string; country: string; city: string; isLiveNow: boolean } }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshStats()
    api<{ products: typeof products }>('/api/products?category=&country=')
      .then((d) => setProducts(d.products.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [refreshStats])

  const totals = stats?.totals
  const countries = stats?.countries ?? []
  const go = (t: string) => navigate(t)

  return (
    <main>
      {/* ================= HERO — choix présentiel / à distance toujours visible ================= */}
      <section className="hero" id="top">
        <GlobeCanvas />
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-kicker">
              <span className="pulse-dot" aria-hidden="true" />
              L&apos;Opportunité C&apos;est Dehors — la plateforme commerciale africaine
            </p>
            <h1 className="hero-logo" aria-label="OCD LIVE & SHOP">
              <span className="word-ocd">OCD</span>
              <span className="badge-live">
                <span className="eq"><i /><i /><i /><i /></span>
                LIVE&nbsp;&amp;&nbsp;SHOP
              </span>
            </h1>
            <p className="hero-tag">
              L&apos;Afrique qui se bat vend <em>en direct</em> — et toute la journée.
            </p>
            <p className="hero-sub">
              Lancez votre live TikTok, soumettez-le sur OCD et gagnez en visibilité dans votre pays.
              Créez votre boutique, vendez vos produits et restez trouvé — même hors ligne.
            </p>

            {/* Le choix live en présentiel / à distance — exigence conservée du site d'origine */}
            <div className="hero-choices">
              <button className="choice" onClick={() => go('/soumettre?mode=presentiel')}>
                <span className="ic" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/></svg>
                </span>
                <span className="txt">
                  <strong>Live en présentiel</strong>
                  <small>À la régie OCD (Bovann) — la régie diffuse pour vous</small>
                </span>
                <span className="arr" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </button>
              <button className="choice" onClick={() => go('/soumettre?mode=distance')}>
                <span className="ic" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </span>
                <span className="txt">
                  <strong>Live à distance</strong>
                  <small>Depuis votre pays — votre lien TikTok, validé par la régie</small>
                </span>
                <span className="arr" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </button>
            </div>

            <div className="hero-stats">
              <span className="hstat">
                <span className="pulse-dot" />
                <b>{totals?.enDirect ?? '…'}</b> vendeurs en direct
              </span>
              {totals && totals.enDirect === 0 && (
                <span className="hstat"><b>{totals.prochainsAujourdhui}</b> sessions à venir aujourd&apos;hui</span>
              )}
              <span className="hstat"><b>{totals?.boutiques ?? '…'}</b> boutiques</span>
              <span className="hstat"><b>{totals?.produits ?? '…'}</b> produits</span>
              <span className="hstat"><b>{totals?.pays ?? '…'}</b> pays</span>
            </div>

            <p className="hero-note">
              Créneaux quotidiens : <strong>matin 08h–11h</strong> · <strong>soir 18h–21h</strong> (heure de votre pays) —{' '}
              <button style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 700 }} onClick={() => go('/live')}>
                voir les vendeurs en direct
              </button>
            </p>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ================= COMPTEURS RÉELS PAR PAYS ================= */}
      <section className="section" id="pays">
        <p className="eyebrow">OCD Live — en direct maintenant</p>
        <h2 className="sec-title">Qui vend en direct, pays par pays&nbsp;?</h2>
        <p className="sec-sub">
          Compteurs calculés en direct à partir des lives validés par la régie et actifs : cliquez sur un pays pour
          découvrir ses vendeurs, puis filtrez par catégorie.
        </p>
        {countries.length === 0 ? (
          <div style={{ marginTop: 42 }}><LoadingCards n={5} h={64} /></div>
        ) : (
          <div className="country-grid" style={{ marginTop: 42 }}>
            {countries.map((c) => (
              <button key={c.code} className="country-card" onClick={() => go(`/live?country=${c.code}`)}>
                <Flag code={c.code} size={26} />
                <span className="cc-txt">
                  <span className="cc-name">{c.name}</span>
                  <span className="cc-count">
                    {c.enDirect > 0 ? (
                      <><b>{c.enDirect}</b> en direct</>
                    ) : (
                      <>Prochaine session aujourd&apos;hui</>
                    )}
                    {c.prochainsAujourdhui > 0 && c.enDirect > 0 && <> · {c.prochainsAujourdhui} à venir</>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ================= COMMENT ÇA MARCHE ================= */}
      <section className="section" id="comment" style={{ background: 'var(--bg-2)' }}>
        <p className="eyebrow">Simple comme un live</p>
        <h2 className="sec-title">Comment ça marche&nbsp;?</h2>
        <p className="sec-sub">Quatre étapes sur votre téléphone. La régie OCD Bovann valide chaque live avant sa mise en ligne.</p>
        <div className="steps-grid">
          <article className="step">
            <span className="num" aria-hidden="true">01</span>
            <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01"/></svg></span>
            <h3>Lancez votre live</h3>
            <p>TikTok, YouTube ou Facebook : démarrez votre direct comme d&apos;habitude, depuis chez vous.</p>
          </article>
          <article className="step">
            <span className="num" aria-hidden="true">02</span>
            <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></span>
            <h3>Soumettez-le sur OCD</h3>
            <p>Un formulaire court : votre nom, pays, catégorie, créneau (matin ou soir) et le lien du live.</p>
          </article>
          <article className="step">
            <span className="num" aria-hidden="true">03</span>
            <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg></span>
            <h3>La régie valide</h3>
            <p>L&apos;équipe OCD Bovann vérifie que vous vendez vraiment en direct, puis accepte ou refuse.</p>
          </article>
          <article className="step">
            <span className="num" aria-hidden="true">04</span>
            <span className="ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg></span>
            <h3>Vous êtes visible</h3>
            <p>Votre fiche apparaît sur OCD Live dans votre pays — et votre boutique est reliée automatiquement.</p>
          </article>
        </div>
      </section>

      {/* ================= ABONNEMENT ================= */}
      <section className="section" id="abonnement">
        <p className="eyebrow">Abonnement vendeur</p>
        <h2 className="sec-title">5 000 FCFA par mois, les deux créneaux</h2>
        <p className="sec-sub">Une seule formule, sans surprise : la visibilité sur OCD Live tous les jours.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18, marginTop: 42 }}>
          <article className="step" style={{ padding: 28 }}>
            <span className="num" aria-hidden="true">€</span>
            <span className="ic"><CatIcon id="calendar" size={26} /></span>
            <h3>Abonnement OCD Live</h3>
            <p className="price" style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--accent-strong)', margin: '6px 0 12px' }}>
              5 000 FCFA <small style={{ display: 'block', fontSize: '0.82rem', color: 'var(--muted-ink)', fontWeight: 600 }}>par mois — Mobile Money ou carte</small>
            </p>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 9, color: 'var(--muted-ink)', fontSize: '0.94rem', padding: 0 }}>
              <li>• Créneau du matin (08h–11h) et du soir (18h–21h)</li>
              <li>• Fiche vendeur avec photo, pays et catégorie</li>
              <li>• Bouton « Regarder le live » vers votre direct</li>
              <li>• Votre boutique OCD Shop reliée à vos lives</li>
              <li>• Historique des paiements, renouvellement en 2 touches</li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: 18, width: '100%' }} onClick={() => go('/abonnement')}>
              M&apos;abonner maintenant
            </button>
          </article>
          <article className="step" style={{ padding: 28, display: 'grid', gap: 12, alignContent: 'start' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Paiement adapté au marché africain</h3>
            <p style={{ color: 'var(--muted-ink)', fontSize: '0.94rem' }}>
              Payez par <strong>Mobile Money</strong> selon votre pays : T-Money et Flooz (Togo), MTN MoMo et Moov Money
              (Bénin), Orange Money et Wave (Côte d&apos;Ivoire, Sénégal), M-Pesa (RD Congo)…
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['T-Money', 'Flooz', 'MTN MoMo', 'Orange Money', 'Wave', 'M-Pesa'].map((m) => (
                <span key={m} className="badge" style={{ textTransform: 'none', letterSpacing: 0 }}>{m}</span>
              ))}
            </div>
            <p style={{ color: 'var(--muted-ink)', fontSize: '0.84rem' }}>
              En mode démonstration, le paiement est <strong>simulé et clairement identifié</strong> : aucun débit réel.
              L&apos;intégration d&apos;un prestataire (CinetPay, PayDunya…) sera branchée en production.
            </p>
          </article>
        </div>
      </section>

      {/* ================= BOVANN — conservé du site d'origine ================= */}
      <section className="section" id="bovann" style={{ background: 'var(--bg-2)' }}>
        <p className="eyebrow">L&apos;Opportunité C&apos;est Dehors — #OCD</p>
        <h2 className="sec-title">Le visage derrière OCD</h2>
        <p className="sec-sub">Derrière l&apos;antenne, un homme qui a fait de l&apos;opportunité un slogan. Rencontre avec Bovann, créateur de contenu, artiste-musicien et entrepreneur camerounais.</p>
        <div className="bio-grid">
          <div className="bio-visual">
            <div className="bio-polaroid"><img src="/ocd/photo-bovann-2.jpg" alt="Bovann en interview" /></div>
            <div className="bio-portrait">
              <img src="/ocd/portrait-bovann.jpg" alt="Bovann, fondateur d'OCD, en costume" />
              <span className="bio-frame" aria-hidden="true" />
              <span className="bio-tag">BOVANN</span>
            </div>
            <p className="bio-quote">« <em>L&apos;Opportunité, C&apos;est Dehors.</em> » Pas juste un slogan&nbsp;: une invitation à aller la chercher.</p>
          </div>
          <div className="bio-copy">
            <p className="bio-desc">
              Kuekam Tenan Vaneck Borel, dit <strong>Bovann</strong>, est un créateur de contenu, artiste-musicien et
              entrepreneur camerounais suivi par plusieurs millions d&apos;abonnés entre l&apos;Afrique et l&apos;Europe.
              Aujourd&apos;hui, il ouvre l&apos;antenne d&apos;OCD pour que chaque entrepreneur du continent ait, lui
              aussi, son moment en direct — et sa boutique à portée de main.
            </p>
            <div className="bio-facts">
              <article className="bio-fact">
                <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></span>
                <div><h3>Des débuts en Allemagne</h3><p>Repéré à Brême sur Musical.ly grâce à son humour, il devient une figure populaire de la jeunesse et de la diaspora africaine.</p></div>
              </article>
              <article className="bio-fact">
                <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                <div><h3>Une communauté immense</h3><p>Sur TikTok et YouTube : vidéos humoristiques, micro-trottoirs et messages de motivation sous le slogan OCD.</p></div>
              </article>
              <article className="bio-fact">
                <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></span>
                <div><h3>Artiste-musicien</h3><p>Sonorités afro-urbaines et influences européennes : Afrika, C&apos;est mon ami, Ma décision, From Africa to the World.</p></div>
              </article>
              <article className="bio-fact">
                <span className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><path d="M9 10h.01M15 10h.01"/></svg></span>
                <div><h3>Entrepreneur &amp; producteur</h3><p>Initiateur de House of Challenge et dirigeant de BOVANN GROUP (Lomé, Togo) : communication, événementiel, management.</p></div>
              </article>
            </div>
            <p className="bio-heart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span><strong>Engagement&nbsp;:</strong> dons de matériel et soutien à des projets communautaires à travers le continent — parce que l&apos;opportunité mérite d&apos;être partagée.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ================= OCD SHOP — aperçu produits ================= */}
      <section className="section" id="shop">
        <p className="eyebrow">OCD Shop — la marketplace</p>
        <h2 className="sec-title">Les boutiques du continent, à portée de main</h2>
        <p className="sec-sub">Nourriture, mode, beauté, électronique… Achetez, commandez ou contactez directement le vendeur — y compris s&apos;il est en direct.</p>
        {loading ? (
          <div style={{ marginTop: 42 }}><LoadingCards n={6} h={300} /></div>
        ) : products.length === 0 ? (
          <div style={{ marginTop: 42 }}>
            <EmptyState title="Aucun produit disponible pour l'instant" sub="Créez votre boutique depuis votre espace vendeur." />
          </div>
        ) : (
          <div className="product-grid" style={{ marginTop: 42 }}>
            {products.map((p) => (
              <article key={p.id} className="product-card">
                <div className="pc-photo">
                  {p.images[0] ? <img src={p.images[0]} alt={p.name} loading="lazy" /> : <div className="ph" style={{ display: 'grid', placeItems: 'center', height: '100%', background: 'var(--icon-bg)', color: 'var(--accent-strong)', fontWeight: 900 }}>OCD</div>}
                </div>
                <div className="pc-body">
                  <span className="pc-name">{p.name}</span>
                  <span className="pc-price">{fmtPrice(p.price, p.currency)}</span>
                  <span className="pc-shop">
                    {p.shop.country && <Flag code={p.shop.country} size={16} />}
                    {p.shop.name} · {p.shop.city}
                    {p.shop.isLiveNow && <span className="badge badge-live-on" style={{ marginLeft: 4 }}><span className="dot" />LIVE</span>}
                  </span>
                  <div className="pc-actions">
                    <button className="btn btn-primary" onClick={() => go('/shop')}>Voir</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => go('/shop')}>Explorer OCD Shop</button>
          <button className="btn btn-ghost" onClick={() => go('/espace-vendeur')}>Créer ma boutique</button>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="cta" id="contact">
        <div className="cta-inner">
          <p className="cta-kicker">Prêt à passer en direct&nbsp;?</p>
          <h2 className="cta-title">Votre produit mérite son <span className="u">live</span> — et sa <span className="u">boutique</span>.</h2>
          <p className="cta-sub">
            Mode présentiel ou à distance, créneau matin ou soir : soumettez votre live, faites-le valider par la régie
            OCD Bovann et ouvrez votre vitrine sur toute l&apos;Afrique.
          </p>
          <div className="cta-actions">
            <a className="btn btn-dark" onClick={() => go('/soumettre')} style={{ cursor: 'pointer' }}>Soumettre mon live</a>
            <a className="btn btn-outline-dark" onClick={() => go('/abonnement')} style={{ cursor: 'pointer' }}>Voir l&apos;abonnement</a>
          </div>
        </div>
      </section>
    </main>
  )
}
