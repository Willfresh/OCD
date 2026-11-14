'use client'

import React from 'react'

// Drapeaux SVG simplifiés (traits distinctifs fidèles) — rendu identique sur tous
// les navigateurs, contrairement aux emojis de drapeaux absents sous Windows.
function starPath(cx: number, cy: number, r: number) {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const rad = (Math.PI / 5) * i - Math.PI / 2
    const rr = i % 2 === 0 ? r : r * 0.382
    const x = cx + rr * Math.cos(rad)
    const y = cy + rr * Math.sin(rad)
    d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2)
  }
  return d + 'Z'
}

const C = {
  green: '#078930',
  yellow: '#FCDD09',
  red: '#DA121A',
  orange: '#FF8200',
  blue: '#012169',
  sky: '#3A9EDE',
  white: '#FFFFFF',
  black: '#000000',
}

function V({ parts }: { parts: React.ReactNode[] }) {
  return <svg viewBox="0 0 60 45" width="100%" height="100%" role="img" aria-hidden="true">{parts}</svg>
}

const FLAGS: Record<string, React.ReactNode> = {
  // Bénin : bande verte verticale + jaune / rouge
  BJ: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.yellow} />,
      <rect key="2" width="20" height="45" fill={C.green} />,
      <rect key="3" x="20" y="22.5" width="40" height="22.5" fill={C.red} />,
    ]} />
  ),
  // Togo : 5 bandes horizontales vert/jaune + carré rouge étoile blanche
  TG: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.green} />,
      <rect key="2" y="9" width="60" height="9" fill={C.yellow} />,
      <rect key="3" y="27" width="60" height="9" fill={C.yellow} />,
      <rect key="4" width="24" height="21" fill={C.red} />,
      <path key="5" d={starPath(12, 10.5, 6.5)} fill={C.white} />,
    ]} />
  ),
  // Cameroun : vert/rouge/jaune verticaux + étoile jaune
  CM: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.red} />,
      <rect key="2" width="20" height="45" fill={C.green} />,
      <rect key="3" x="40" width="20" height="45" fill={C.yellow} />,
      <path key="4" d={starPath(30, 22.5, 7)} fill={C.yellow} />,
    ]} />
  ),
  // Côte d'Ivoire : orange/blanc/vert verticaux
  CI: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.white} />,
      <rect key="2" width="20" height="45" fill={C.orange} />,
      <rect key="3" x="40" width="20" height="45" fill={C.green} />,
    ]} />
  ),
  // Nigeria : vert/blanc/vert verticaux
  NG: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.white} />,
      <rect key="2" width="20" height="45" fill={C.green} />,
      <rect key="3" x="40" width="20" height="45" fill={C.green} />,
    ]} />
  ),
  // Ghana : rouge/or/vert horizontaux + étoile noire
  GH: (
    <V parts={[
      <rect key="1" width="60" height="45" fill="#FCDD09" />,
      <rect key="2" height="15" width="60" fill={C.red} />,
      <rect key="3" y="30" width="60" height="15" fill={C.green} />,
      <path key="4" d={starPath(30, 22.5, 6.5)} fill={C.black} />,
    ]} />
  ),
  // Sénégal : vert/jaune/rouge verticaux + étoile verte
  SN: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.yellow} />,
      <rect key="2" width="20" height="45" fill={C.green} />,
      <rect key="3" x="40" width="20" height="45" fill={C.red} />,
      <path key="4" d={starPath(30, 22.5, 6.5)} fill={C.green} />,
    ]} />
  ),
  // Burkina Faso : rouge/vert horizontaux + étoile jaune
  BF: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.red} />,
      <rect key="2" y="22.5" width="60" height="22.5" fill={C.green} />,
      <path key="3" d={starPath(30, 22.5, 7)} fill={C.yellow} />,
    ]} />
  ),
  // Mali : vert/jaune/rouge verticaux
  ML: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.yellow} />,
      <rect key="2" width="20" height="45" fill={C.green} />,
      <rect key="3" x="40" width="20" height="45" fill={C.red} />,
    ]} />
  ),
  // Guinée : rouge/jaune/vert verticaux
  GN: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.yellow} />,
      <rect key="2" width="20" height="45" fill={C.red} />,
      <rect key="3" x="40" width="20" height="45" fill={C.green} />,
    ]} />
  ),
  // RD Congo : bleu ciel + bande diagonale rouge bordée de jaune + étoile jaune
  CD: (
    <V parts={[
      <rect key="1" width="60" height="45" fill={C.sky} />,
      <polygon key="2" points="-6,38 60,4 60,12 -6,45" fill="#E8BC00" />,
      <polygon key="3" points="-6,40 60,6 60,10 -6,43" fill={C.red} />,
      <path key="4" d={starPath(11, 10, 7)} fill="#FDEF00" />,
    ]} />
  ),
}

export function Flag({ code, size = 22 }: { code: string; size?: number }) {
  const node = FLAGS[code]
  if (!node) return null
  return (
    <span className="flag" style={{ width: size * 1.34, height: size }} aria-label={`Drapeau ${code}`}>
      {node}
    </span>
  )
}
