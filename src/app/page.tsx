'use client'

import React, { useEffect } from 'react'
import { useApp, parseHash } from '@/components/ocd/store'
import { Intro, Header, Footer, WaFloat, Toasts, TopFloat } from '@/components/ocd/chrome'
import { HomeView } from '@/components/ocd/home'
import { LiveView } from '@/components/ocd/live'
import { ShopView, ShopDetailView, ProductDetailView } from '@/components/ocd/shop'
import { SubmitView } from '@/components/ocd/submit'
import { SubscribeView } from '@/components/ocd/subscribe'
import { AuthView } from '@/components/ocd/auth'
import { VendorDashboard } from '@/components/ocd/vendor'
import { AdminDashboard } from '@/components/ocd/admin'
import { ProfileView } from '@/components/ocd/profile'

export default function Page() {
  const { route, setRoute, refreshUser, refreshStats } = useApp()
  const introDone = useApp((s) => s.introDone)

  // Routage par hash (une seule page, navigation fluide, bouton retour fonctionnel)
  useEffect(() => {
    const fn = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    fn()
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [setRoute])

  useEffect(() => {
    refreshUser()
    refreshStats()
  }, [refreshUser, refreshStats])

  // Ajuste le titre selon la vue
  useEffect(() => {
    const p = route.path[0]
    const titles: Record<string, string> = {
      '': "OCD Live & Shop — L'Opportunité C'est Dehors",
      live: 'OCD Live — vendeurs en direct',
      shop: 'OCD Shop — la marketplace africaine',
      soumettre: 'Soumettre mon live — OCD',
      abonnement: 'Abonnement OCD Live — 5 000 FCFA/mois',
      connexion: 'Connexion vendeur — OCD',
      profil: 'Mon profil — OCD',
      article: 'Article — OCD Shop',
      'espace-vendeur': 'Mon espace vendeur — OCD',
      regie: 'Espace régie — OCD Bovann',
    }
    document.title = (p && titles[p]) || "OCD — L'Opportunité C'est Dehors"
  }, [route])

  const view = (() => {
    const p = route.path[0]
    switch (p) {
      case 'live':
        return <LiveView />
      case 'shop':
        return <ShopView />
      case 'boutique':
        return <ShopDetailView slug={route.path[1] ?? ''} />
      case 'article':
        return <ProductDetailView id={route.path[1] ?? ''} />
      case 'soumettre':
        return <SubmitView />
      case 'abonnement':
        return <SubscribeView />
      case 'connexion':
        return <AuthView />
      case 'profil':
        return <ProfileView />
      case 'espace-vendeur':
        return <VendorDashboard />
      case 'regie':
        return <AdminDashboard />
      default:
        return <HomeView />
    }
  })()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!introDone && <Intro />}
      <Header />
      <div style={{ flex: 1 }}>{view}</div>
      <Footer />
      <WaFloat />
      <TopFloat />
      <Toasts />
    </div>
  )
}
