/**
 * Génère src/lib/logos.generated.ts : uniquement les logos du catalogue d'abonnements,
 * pour ne pas embarquer des milliers d'icônes dans l'app.
 *
 *   npm run logos
 *
 * Sources (paquets @iconify-json, installés en devDependencies) :
 *  - Simple Icons (CC0) : logos officiels en une couleur
 *  - Arcticons (CC BY-SA 4.0, Donnnno et contributeurs) : logos redessinés au trait, pour les marques absentes de Simple Icons
 *  - Logos (CC0) : logo en couleurs (Midjourney)
 *  - Material Design Icons (Apache 2.0) : pictogrammes pour ce qui n'est pas une marque (assurance, box…)
 * Les marques restent la propriété de leurs détenteurs ; elles servent ici à reconnaître l'abonnement.
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const SETS = {
  si: require('@iconify-json/simple-icons/icons.json'),
  arc: require('@iconify-json/arcticons/icons.json'),
  logos: require('@iconify-json/logos/icons.json'),
  mdi: require('@iconify-json/mdi/icons.json'),
}

/** id du catalogue → [jeu, nom de l'icône] */
const MAP = {
  claude: ['si', 'claude'],
  chatgpt: ['si', 'openai'],
  mistral: ['si', 'mistralai'],
  perplexity: ['si', 'perplexity'],
  midjourney: ['logos', 'midjourney'],
  adobe: ['si', 'adobecreativecloud'],
  canva: ['si', 'canva'],
  figma: ['si', 'figma'],
  capcut: ['arc', 'capcut'],
  notion: ['si', 'notion'],
  'google-workspace': ['si', 'google'],
  'microsoft-365': ['si', 'microsoft'],
  shopify: ['si', 'shopify'],
  domaine: ['mdi', 'web'],
  hebergement: ['mdi', 'server'],
  'basic-fit': ['arc', 'basic-fit'],
  'fitness-park': ['arc', 'fitnesspark'],
  keepcool: ['mdi', 'dumbbell'],
  escalade: ['mdi', 'image-filter-hdr'],
  netflix: ['si', 'netflix'],
  crunchyroll: ['si', 'crunchyroll'],
  adn: ['arc', 'adn'],
  disney: ['arc', 'disney'],
  prime: ['si', 'primevideo'],
  canal: ['arc', 'mycanal'],
  youtube: ['si', 'youtube'],
  spotify: ['si', 'spotify'],
  deezer: ['si', 'deezer'],
  'apple-music': ['si', 'applemusic'],
  'ps-plus': ['si', 'playstation'],
  'game-pass': ['si', 'xbox'],
  'switch-online': ['si', 'nintendoswitch'],
  icloud: ['si', 'icloud'],
  'google-one': ['si', 'google'],
  mobile: ['mdi', 'cellphone'],
  box: ['mdi', 'router-wireless'],
  navigo: ['arc', 'ratp'],
  velib: ['mdi', 'bike'],
  'assurance-auto': ['mdi', 'car'],
  'assurance-habitation': ['mdi', 'shield-home'],
  mutuelle: ['mdi', 'heart-pulse'],
  electricite: ['mdi', 'lightning-bolt'],
  'rc-pro': ['mdi', 'briefcase'],
  'banque-pro': ['mdi', 'bank'],
}

function resolve(set, name) {
  let icon = set.icons[name]
  const alias = set.aliases?.[name]
  if (!icon && alias) icon = { ...set.icons[alias.parent], ...alias }
  if (!icon) throw new Error(`Icône introuvable : ${name}`)
  return { body: icon.body, width: icon.width ?? set.width ?? 16, height: icon.height ?? set.height ?? 16 }
}

const out = {}
for (const [id, [setName, name]] of Object.entries(MAP)) {
  const { body, width, height } = resolve(SETS[setName], name)
  out[id] = {
    body,
    viewBox: `0 0 ${width} ${height}`,
    // brand : vrai logo ; color : logo déjà en couleurs ; generic : simple pictogramme
    kind: setName === 'mdi' ? 'generic' : setName === 'logos' ? 'color' : 'brand',
    line: setName === 'arc',
  }
}

const file = `// Fichier généré par scripts/build-logos.mjs : ne pas modifier à la main.
// Simple Icons (CC0), Arcticons (CC BY-SA 4.0), Logos (CC0), Material Design Icons (Apache 2.0).

export interface Logo {
  body: string
  viewBox: string
  kind: 'brand' | 'color' | 'generic'
  /** Dessiné au trait (Arcticons) plutôt qu'en aplat */
  line: boolean
}

export const LOGOS: Record<string, Logo> = ${JSON.stringify(out, null, 2)}
`
writeFileSync(new URL('../src/lib/logos.generated.ts', import.meta.url), file)
console.log(`${Object.keys(out).length} logos écrits dans src/lib/logos.generated.ts`)
