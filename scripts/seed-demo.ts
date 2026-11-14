// Initialisation des données de démonstration (badges DÉMO partout)
// Charge d'abord .env (utilisable en local comme en production)
import 'dotenv/config'
import { seedDemoData } from '@/lib/ocd/seed'

async function main() {
  const r = await seedDemoData()
  console.log(r.ok ? 'DÉMO OK — comptes, boutiques, produits, lives et commandes créés.' : 'Échec')
  process.exit(r.ok ? 0 : 1)
}

main().catch((e) => {
  console.error('Échec du seed :', e?.message ?? e)
  process.exit(1)
})
