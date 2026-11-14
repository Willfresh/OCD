'use client'

import { useEffect, useRef } from 'react'

/* ================================================================
   Globe OCD — héros de la page d'accueil.
   • Sphère rotative bien visible, avec la carte de l'Afrique dessinée
     dessus (contour du continent + Madagascar + graticule méridiens/parallèles)
   • Villes africaines marquées de points pulsants (Lomé = hub de la régie)
   • Connexions animées « étoiles filantes » : des comètes avec traîne
     lumineuse relient des points tout au long de l'Afrique
   • Interactif : glisser au doigt / à la souris pour faire tourner le globe
   ================================================================ */

type Vec = { x: number; y: number; z: number }

const D2R = Math.PI / 180
// Centre longitudinal de l'Afrique (~17°E) : le continent fait face au
// spectateur au démarrage de la rotation.
const L0 = 17 * D2R

function ll(lat: number, lng: number): Vec {
  const p = lat * D2R
  const l = lng * D2R - L0
  return { x: Math.cos(p) * Math.sin(l), y: Math.sin(p), z: Math.cos(p) * Math.cos(l) }
}

/* ---------- Contour simplifié de l'Afrique (lat, lng) — sens horaire depuis Tanger ---------- */
const AFRICA_RAW: [number, number][] = [
  [35.9, -5.9],  // Tanger
  [35.2, -2.2],
  [36.6, 3.1],   // Alger
  [36.9, 6.9],   // Skikda
  [37.1, 10.2],  // Tunis
  [33.9, 10.1],  // Golfe de Gabès
  [32.9, 13.2],  // Tripoli
  [31.0, 16.6],  // Golfe de Syrte
  [32.1, 20.1],  // Benghazi
  [32.8, 22.6],  // Derna
  [31.2, 29.9],  // Alexandrie
  [31.3, 32.3],  // Port Saïd
  [29.9, 32.5],  // Suez
  [27.0, 34.0],  // Mer Rouge
  [22.0, 36.5],
  [19.1, 37.3],  // Port-Soudan
  [15.6, 39.5],  // Massaoua
  [12.6, 43.3],  // Bab-el-Mandeb
  [11.5, 43.1],  // Djibouti
  [10.4, 45.0],  // Berbera
  [11.8, 51.3],  // Cap Guardafui (la Corne)
  [7.5, 47.5],   // côte somalienne
  [2.0, 45.3],   // Mogadiscio
  [-4.0, 39.7],  // Mombasa
  [-6.8, 39.3],  // Dar es Salaam
  [-9.9, 39.5],
  [-10.3, 40.3], // Mtwara
  [-14.5, 40.7], // Nacala
  [-17.9, 36.9], // Quelimane
  [-19.8, 34.9], // Beira
  [-23.8, 35.4], // Inhambane
  [-26.0, 32.6], // Maputo
  [-29.9, 31.0], // Durban
  [-34.0, 25.6], // Port Elizabeth
  [-34.8, 20.0], // Cap Agulhas
  [-34.3, 18.4], // Cap de Bonne-Espérance
  [-33.0, 17.9], // Saldanha
  [-22.9, 14.5], // Walvis Bay
  [-15.2, 12.1], // Namibe
  [-8.8, 13.2],  // Luanda
  [-5.5, 12.2],  // Cabinda
  [0.4, 9.5],    // Libreville
  [4.0, 9.7],    // Douala
  [4.3, 6.0],    // Delta du Niger
  [6.4, 3.4],    // Lagos
  [6.35, 2.43],  // Cotonou
  [6.13, 1.22],  // Lomé
  [5.55, -0.2],  // Accra
  [4.7, -2.1],   // Cap des Trois-Pointes
  [5.2, -4.0],   // Abidjan
  [6.3, -10.8],  // Monrovia
  [8.5, -13.2],  // Freetown
  [9.5, -13.7],  // Conakry
  [11.9, -15.9], // Bissau
  [13.5, -16.7], // Banjul
  [14.7, -17.5], // Dakar
  [20.9, -17.0], // Nouadhibou
  [23.7, -15.9], // Dakhla
  [27.1, -13.2], // Laayoune
  [29.4, -10.2], // Sidi Ifni
  [31.5, -9.8],  // Essaouira
  [33.6, -7.6],  // Casablanca
  [34.0, -6.8],  // Rabat
]

/* ---------- Madagascar ---------- */
const MADAGASCAR_RAW: [number, number][] = [
  [-11.9, 49.3],
  [-15.3, 50.5],
  [-18.1, 49.5],
  [-24.9, 47.6],
  [-25.6, 45.2],
  [-24.0, 43.7],
  [-20.0, 44.0],
  [-16.0, 44.5],
]

const AFRICA = AFRICA_RAW.map(([a, b]) => ll(a, b))
const MADAGASCAR = MADAGASCAR_RAW.map(([a, b]) => ll(a, b))

/* ---------- Villes africaines reliées par les connexions ---------- */
const CITY_RAW: { lat: number; lng: number; hub?: boolean }[] = [
  { lat: 6.13, lng: 1.22, hub: true }, // Lomé — siège de la régie OCD
  { lat: 6.37, lng: 2.43 },           // Cotonou
  { lat: 5.32, lng: -4.02 },           // Abidjan
  { lat: 5.55, lng: -0.2 },            // Accra
  { lat: 6.52, lng: 3.38 },            // Lagos
  { lat: 9.06, lng: 7.49 },            // Abuja
  { lat: 4.05, lng: 9.7 },             // Douala
  { lat: 3.87, lng: 11.52 },            // Yaoundé
  { lat: 14.72, lng: -17.47 },         // Dakar
  { lat: -4.44, lng: 15.27 },          // Kinshasa
  { lat: -1.29, lng: 36.82 },          // Nairobi
  { lat: -26.2, lng: 28.05 },          // Johannesburg
  { lat: 30.04, lng: 31.24 },          // Le Caire
  { lat: 33.57, lng: -7.59 },          // Casablanca
]
const CITIES = CITY_RAW.map((c) => ({ v: ll(c.lat, c.lng), hub: !!c.hub }))

/* Connexions possibles (paires de villes) — le hub Lomé relie tout le continent */
const PAIRS: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [0, 13],
  [1, 4],   // Cotonou – Lagos
  [2, 4],   // Abidjan – Lagos
  [2, 3],   // Abidjan – Accra
  [4, 5],   // Lagos – Abuja
  [8, 13],  // Dakar – Casablanca
  [12, 13], // Le Caire – Casablanca
  [6, 9],   // Douala – Kinshasa
  [7, 9],   // Yaoundé – Kinshasa
  [9, 10],  // Kinshasa – Nairobi
  [10, 11], // Nairobi – Johannesburg
]

/* Interpolation sphérique (slerp) entre deux villes, avec altitude :
   la comète « décolle » de la surface au milieu de son trajet. */
function slerp(a: Vec, b: Vec, om: number, s: number, lift: number): Vec {
  if (om < 1e-4) return { x: a.x * lift, y: a.y * lift, z: a.z * lift }
  const so = Math.sin(om)
  const w1 = Math.sin((1 - s) * om) / so
  const w2 = Math.sin(s * om) / so
  return {
    x: (a.x * w1 + b.x * w2) * lift,
    y: (a.y * w1 + b.y * w2) * lift,
    z: (a.z * w1 + b.z * w2) * lift,
  }
}

interface Arc {
  a: Vec
  b: Vec
  om: number
  p: number // progression 0 → 1
  speed: number
  trail: number
  pause: number
  alt: number
}

export function GlobeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let running = true
    // Rotation « balançoire » : le globe tourne en continu (va-et-vient régulier,
    // comme un plateau d'exposition) tout en gardant la carte de l'Afrique
    // dessinée face au spectateur. Le glisser au doigt déplace le centre.
    let center = 0.06
    let phase = 0
    const SWAY = 0.65 // amplitude ≈ ±37° : l'Afrique reste bien centrée et visible
    const OMEGA = reduced ? 0 : (Math.PI * 2) / 20 // période ≈ 20 s
    let rotX = 0.38 // inclinaison : on voit l'Afrique entière, du Cap à la Méditerranée
    let dragging = false
    let lastX = 0
    let lastY = 0
    let prev = performance.now()

    /* Graticule pré-calculé (méridiens + parallèles) */
    const parallels: Vec[][] = []
    for (let lat = -60; lat <= 80; lat += 20) {
      const line: Vec[] = []
      for (let lng = -180; lng <= 180; lng += 10) line.push(ll(lat, lng))
      parallels.push(line)
    }
    const meridians: Vec[][] = []
    for (let lng = -180; lng < 180; lng += 20) {
      const line: Vec[] = []
      for (let lat = -90; lat <= 90; lat += 10) line.push(ll(lat, lng))
      meridians.push(line)
    }

    /* Arcs « étoiles filantes » */
    const spawn = (): Arc => {
      const [i, j] = PAIRS[(Math.random() * PAIRS.length) | 0]
      const a = CITIES[i].v
      const b = CITIES[j].v
      const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))
      return {
        a,
        b,
        om: Math.acos(dot),
        p: 0,
        speed: 0.3 + Math.random() * 0.25,
        trail: 0.22 + Math.random() * 0.16,
        pause: Math.random() * 1.2,
        alt: 0.14 + Math.random() * 0.16,
      }
    }
    const arcs: Arc[] = []
    // Départs échelonnés : il y a toujours des étoiles filantes en trajet
    if (!reduced) for (let i = 0; i < 7; i++) {
      const a = spawn()
      a.pause = i * 0.55
      arcs.push(a)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const dark = () => document.documentElement.getAttribute('data-theme') === 'dark'

    const draw = () => {
      if (!running) return
      const now = performance.now()
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const t = now / 1000

      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      const mobile = w < 900
      // Mobile : bande dédiée en BAS du héros (padding-bottom 425px côté CSS).
      // Desktop : globe à droite du texte, voilé progressivement par le scrim.
      const cx = mobile ? w * 0.5 : w * 0.74
      const cy = mobile ? h - 212 : h * 0.5
      const R = mobile ? Math.min(w * 0.4, 178) : Math.min(w * 0.22, h * 0.38)
      ctx.clearRect(0, 0, w, h)

      if (!dragging) phase += OMEGA * dt
      const rotY = center + SWAY * Math.sin(phase)
      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const isDark = dark()

      /* Projection : rotation Y (balançoire) puis inclinaison X → écran */
      const rot = (v: Vec) => {
        const x1 = v.x * cosY + v.z * sinY
        const z1 = -v.x * sinY + v.z * cosY
        const y2 = v.y * cosX - z1 * sinX
        const z2 = v.y * sinX + z1 * cosX
        return { sx: cx + x1 * R, sy: cy - y2 * R, z: z2, x: x1, y: y2 }
      }
      const fade = (z: number) => Math.max(0, Math.min(1, (z + 0.06) / 0.3))

      /* --- Halo lumineux derrière le globe --- */
      const halo = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.45)
      halo.addColorStop(0, isDark ? 'rgba(250,73,0,0.16)' : 'rgba(250,73,0,0.10)')
      halo.addColorStop(1, 'rgba(250,73,0,0)')
      ctx.fillStyle = halo
      ctx.fillRect(cx - R * 1.5, cy - R * 1.5, R * 3, R * 3)

      /* --- Sphère : disque léger + liseré du limbe --- */
      const disc = ctx.createRadialGradient(cx - R * 0.28, cy - R * 0.34, R * 0.1, cx, cy, R)
      disc.addColorStop(0, isDark ? 'rgba(244,237,228,0.12)' : 'rgba(255,255,255,0.62)')
      disc.addColorStop(0.78, isDark ? 'rgba(244,237,228,0.04)' : 'rgba(255,255,255,0.16)')
      disc.addColorStop(1, isDark ? 'rgba(250,73,0,0.10)' : 'rgba(250,73,0,0.07)')
      ctx.fillStyle = disc
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = isDark ? 'rgba(250,73,0,0.7)' : 'rgba(250,73,0,0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      /* --- Graticule (méridiens + parallèles, face avant uniquement) --- */
      const grat = isDark ? 'rgba(250,73,0,0.18)' : 'rgba(60,38,20,0.13)'
      const strokeFront = (line: Vec[], style: string, width: number) => {
        ctx.beginPath()
        let pen = false
        for (const v of line) {
          const r = rot(v)
          if (r.z < 0.02) {
            pen = false
            continue
          }
          if (pen) ctx.lineTo(r.sx, r.sy)
          else {
            ctx.moveTo(r.sx, r.sy)
            pen = true
          }
        }
        ctx.strokeStyle = style
        ctx.lineWidth = width
        ctx.stroke()
      }
      for (const m of meridians) strokeFront(m, grat, 0.9)
      for (const p of parallels) strokeFront(p, grat, 0.9)
      // Équateur (lat 0 = index 3) un peu plus présent
      strokeFront(parallels[3], isDark ? 'rgba(250,73,0,0.3)' : 'rgba(60,38,20,0.22)', 1.1)

      /* --- La carte de l'Afrique, dessinée sur le globe --- */
      const drawLand = (poly: Vec[]) => {
        ctx.beginPath()
        let started = false
        for (const v of poly) {
          const r = rot(v)
          let sx = r.sx
          let sy = r.sy
          if (r.z < 0) {
            // Point passé derrière le limbe : on le raccroche au bord du globe
            const dx = r.x
            const dy = -r.y
            const len = Math.hypot(dx, dy) || 1e-6
            sx = cx + (dx / len) * R
            sy = cy + (dy / len) * R
          }
          if (!started) {
            ctx.moveTo(sx, sy)
            started = true
          } else {
            ctx.lineTo(sx, sy)
          }
        }
        ctx.closePath()
        ctx.fillStyle = isDark ? 'rgba(250,73,0,0.16)' : 'rgba(250,73,0,0.09)'
        ctx.fill()
        ctx.strokeStyle = isDark ? 'rgba(250,73,0,0.92)' : 'rgba(250,73,0,0.85)'
        ctx.lineWidth = Math.max(1.6, R * 0.008)
        ctx.stroke()
      }
      drawLand(AFRICA)
      drawLand(MADAGASCAR)

      /* --- Villes : points pulsants + anneau du hub Lomé --- */
      CITIES.forEach((c, i) => {
        const r = rot(c.v)
        if (r.z < -0.05) return
        const f = fade(r.z)
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.1 + i * 1.7)
        const base = c.hub ? 3.1 : 2.2
        const rad = base + pulse * (c.hub ? 1.4 : 0.9)
        // halo
        ctx.beginPath()
        ctx.arc(r.sx, r.sy, rad * 2.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(250,73,0,${(0.13 + 0.12 * pulse) * f})`
        ctx.fill()
        // point
        ctx.beginPath()
        ctx.arc(r.sx, r.sy, rad, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(250,73,0,${0.88 * f})`
        ctx.fill()
        // anneau qui s'étend depuis Lomé (le siège de la régie)
        if (c.hub) {
          const pr = (t * 0.4) % 1
          ctx.beginPath()
          ctx.arc(r.sx, r.sy, R * (0.02 + 0.075 * pr), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(250,73,0,${(1 - pr) * 0.45 * f})`
          ctx.lineWidth = 1.4
          ctx.stroke()
        }
      })

      /* --- Connexions « étoiles filantes » entre villes africaines --- */
      if (!reduced) {
        for (let ai = 0; ai < arcs.length; ai++) {
          let arc = arcs[ai]
          // Cycle de vie : pause → trajet (comète) → pause → nouvelle paire de villes
          if (arc.pause > 0) {
            arc.pause -= dt
            if (arc.pause <= 0) {
              // nouvelle étoile filante : nouvelle paire de villes, départ immédiat
              arc = spawn()
              arc.pause = 0
              arcs[ai] = arc
            }
          }
          if (arc.pause > 0) continue
          arc.p += arc.speed * dt
          if (arc.p >= 1) {
            arc.p = 1
            arc.pause = 0.4 + Math.random() * 0.8
          }

          const arcPoint = (s: number) => slerp(arc.a, arc.b, arc.om, s, 1 + arc.alt * Math.sin(Math.PI * s))

          /* Ligne de connexion persistante (discrète) reliant les deux villes */
          ctx.beginPath()
          let pen = false
          const LN = 20
          for (let k = 0; k <= LN; k++) {
            const r = rot(arcPoint(k / LN))
            if (r.z < 0.02) {
              pen = false
              continue
            }
            if (pen) ctx.lineTo(r.sx, r.sy)
            else {
              ctx.moveTo(r.sx, r.sy)
              pen = true
            }
          }
          ctx.strokeStyle = isDark ? 'rgba(250,73,0,0.4)' : 'rgba(250,73,0,0.26)'
          ctx.lineWidth = 1.3
          ctx.stroke()

          /* L'étoile filante : comète à traîne lumineuse, tête brillante */
          const s0 = Math.max(0, arc.p - arc.trail)
          const steps = 24
          let prevR: { sx: number; sy: number; z: number } | null = null
          for (let k = 0; k <= steps; k++) {
            const s = s0 + (arc.p - s0) * (k / steps)
            const r = rot(arcPoint(s))
            const kpos = k / steps // 0 = queue, 1 = tête de la comète
            if (prevR && r.z > -0.06 && prevR.z > -0.06) {
              const fz = fade(Math.min(r.z, prevR.z))
              if (fz > 0.02) {
                // halo large et doux
                ctx.beginPath()
                ctx.moveTo(prevR.sx, prevR.sy)
                ctx.lineTo(r.sx, r.sy)
                ctx.strokeStyle = `rgba(250,73,0,${Math.pow(kpos, 1.4) * 0.3 * fz})`
                ctx.lineWidth = 3 + 7 * kpos
                ctx.lineCap = 'round'
                ctx.stroke()
                // cœur de la traîne : fin et pâle à l'arrière, épais et vif à la tête
                ctx.beginPath()
                ctx.moveTo(prevR.sx, prevR.sy)
                ctx.lineTo(r.sx, r.sy)
                ctx.strokeStyle = `rgba(250,73,0,${Math.pow(kpos, 1.4) * 0.9 * fz})`
                ctx.lineWidth = 0.6 + 3.2 * kpos
                ctx.stroke()
              }
            }
            // tête lumineuse (au dernier segment seulement)
            if (k === steps && r.z > -0.06) {
              const fz = fade(r.z)
              ctx.beginPath()
              ctx.arc(r.sx, r.sy, 10, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(250,73,0,${0.4 * fz})`
              ctx.fill()
              ctx.beginPath()
              ctx.arc(r.sx, r.sy, 3.4, 0, Math.PI * 2)
              ctx.fillStyle = `rgba(255,241,230,${0.95 * fz})`
              ctx.fill()
            }
            prevR = r
          }
        }
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    /* Interaction : faire tourner le globe au doigt / à la souris */
    const down = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.classList.add('grabbing')
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      center += (e.clientX - lastX) * 0.006
      rotX = Math.max(-1.2, Math.min(1.2, rotX + (e.clientY - lastY) * 0.004))
      lastX = e.clientX
      lastY = e.clientY
    }
    const up = () => {
      dragging = false
      canvas.classList.remove('grabbing')
    }
    canvas.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  return <canvas id="hero-canvas" ref={ref} aria-hidden="true" />
}
