/**
 * Catalogue d'abonnements courants, pour remplir les charges fixes en un geste.
 * Prix indicatifs (France, 2026), toujours modifiables avant d'ajouter :
 * ils changent souvent, le bon montant est celui de ta facture.
 */

export type Billing = 'mois' | 'an' | '4sem'

export interface SubscriptionPlan {
  label: string
  /** Prix en centimes pour la période */
  price: number
  billing: Billing
}

export type SubscriptionGroupId = 'ia' | 'creation' | 'sport' | 'video' | 'musique' | 'jeux' | 'cloud' | 'transport' | 'maison'

export interface SubscriptionGroup {
  id: SubscriptionGroupId
  label: string
  /** Petit caractère japonais affiché à côté du titre */
  kanji: string
}

export const SUBSCRIPTION_GROUPS: SubscriptionGroup[] = [
  { id: 'ia', label: 'Intelligence artificielle', kanji: '知' },
  { id: 'creation', label: 'Création et outils pro', kanji: '創' },
  { id: 'sport', label: 'Sport', kanji: '力' },
  { id: 'video', label: 'Vidéo et anime', kanji: '映' },
  { id: 'musique', label: 'Musique', kanji: '音' },
  { id: 'jeux', label: 'Jeux vidéo', kanji: '遊' },
  { id: 'cloud', label: 'Cloud, téléphone, internet', kanji: '電' },
  { id: 'transport', label: 'Transport', kanji: '駅' },
  { id: 'maison', label: 'Maison et assurances', kanji: '家' },
]

export interface Subscription {
  id: string
  /** Couleur de la marque, pour le fond de la pastille */
  color: string
  name: string
  group: SubscriptionGroupId
  plans: SubscriptionPlan[]
  /** Coché « pour mon activité » par défaut */
  pro?: boolean
  /** Autres mots pour la recherche */
  keywords?: string
}

const m = (label: string, euros: number): SubscriptionPlan => ({ label, price: Math.round(euros * 100), billing: 'mois' })
const y = (label: string, euros: number): SubscriptionPlan => ({ label, price: Math.round(euros * 100), billing: 'an' })
const w4 = (label: string, euros: number): SubscriptionPlan => ({ label, price: Math.round(euros * 100), billing: '4sem' })

export const SUBSCRIPTIONS: Subscription[] = [
  // IA (facturés en dollars pour la plupart : le montant en euros varie un peu)
  { id: 'claude', color: '#D97757', name: 'Claude', group: 'ia', pro: true, keywords: 'anthropic ia', plans: [m('Pro', 21.6), m('Max 5x', 108), m('Max 20x', 216)] },
  { id: 'chatgpt', color: '#10A37F', name: 'ChatGPT', group: 'ia', pro: true, keywords: 'openai gpt', plans: [m('Plus', 23), m('Pro', 229)] },
  { id: 'mistral', color: '#FA520F', name: 'Le Chat (Mistral)', group: 'ia', pro: true, keywords: 'mistral', plans: [m('Pro', 14.99)] },
  { id: 'perplexity', color: '#1FB8CD', name: 'Perplexity', group: 'ia', pro: true, plans: [m('Pro', 22)] },
  { id: 'midjourney', color: '#FFFFFF', name: 'Midjourney', group: 'ia', pro: true, keywords: 'image', plans: [m('Basic', 9), m('Standard', 27)] },

  // Création et outils pro
  { id: 'adobe', color: '#DA1F26', name: 'Adobe Creative Cloud', group: 'creation', pro: true, keywords: 'photoshop illustrator premiere', plans: [m('Étudiant', 19.99), m('Photographie', 14.99), m('Toutes les applis', 77.99)] },
  { id: 'canva', color: '#00C4CC', name: 'Canva Pro', group: 'creation', pro: true, plans: [m('Mensuel', 11.99), y('Annuel', 110)] },
  { id: 'figma', color: '#F24E1E', name: 'Figma', group: 'creation', pro: true, plans: [m('Professional', 15)] },
  { id: 'capcut', color: '#000000', name: 'CapCut Pro', group: 'creation', pro: true, keywords: 'montage video', plans: [m('Mensuel', 9.99)] },
  { id: 'notion', color: '#FFFFFF', name: 'Notion', group: 'creation', pro: true, plans: [m('Plus', 11.5)] },
  { id: 'google-workspace', color: '#4285F4', name: 'Google Workspace', group: 'creation', pro: true, keywords: 'gmail pro', plans: [m('Business Starter', 8.1)] },
  { id: 'microsoft-365', color: '#D83B01', name: 'Microsoft 365', group: 'creation', keywords: 'word excel office', plans: [m('Personnel', 10), y('Personnel annuel', 99)] },
  { id: 'shopify', color: '#7AB55C', name: 'Shopify', group: 'creation', pro: true, keywords: 'boutique', plans: [m('Basic', 36)] },
  { id: 'domaine', color: '#5E5A70', name: 'Nom de domaine', group: 'creation', pro: true, keywords: 'site ovh hostinger', plans: [y('Annuel', 15)] },
  { id: 'hebergement', color: '#673DE6', name: 'Hébergement web', group: 'creation', pro: true, keywords: 'site serveur', plans: [m('Mensuel', 6)] },

  // Sport
  { id: 'basic-fit', color: '#FF7300', name: 'Basic-Fit', group: 'sport', keywords: 'salle muscu', plans: [w4('Basic', 19.99), w4('Comfort', 24.99), w4('Premium', 29.99)] },
  { id: 'fitness-park', color: '#E30613', name: 'Fitness Park', group: 'sport', keywords: 'salle muscu', plans: [m('Standard', 29.95), m('Ultimate', 39.95)] },
  { id: 'keepcool', color: '#FFC20E', name: 'Keepcool', group: 'sport', keywords: 'salle', plans: [m('Mensuel', 29.9)] },
  { id: 'escalade', color: '#3E8E5E', name: "Salle d'escalade", group: 'sport', keywords: 'bloc climbing', plans: [m('Mensuel', 55)] },

  // Vidéo et anime
  { id: 'netflix', color: '#E50914', name: 'Netflix', group: 'video', plans: [m('Standard avec pub', 7.99), m('Standard', 14.99), m('Premium', 21.99)] },
  { id: 'crunchyroll', color: '#FF5E00', name: 'Crunchyroll', group: 'video', keywords: 'anime manga', plans: [m('Fan', 6.99), m('Mega Fan', 9.99)] },
  { id: 'adn', color: '#0096D6', name: 'ADN', group: 'video', keywords: 'anime digital network', plans: [m('Mensuel', 6.99)] },
  { id: 'disney', color: '#113CCF', name: 'Disney+', group: 'video', plans: [m('Standard avec pub', 5.99), m('Standard', 10.99), m('Premium', 15.99)] },
  { id: 'prime', color: '#00A8E1', name: 'Amazon Prime', group: 'video', keywords: 'prime video', plans: [m('Mensuel', 6.99), y('Annuel', 69.9)] },
  { id: 'canal', color: '#000000', name: 'Canal+', group: 'video', plans: [m('Essentiel', 24.99)] },
  { id: 'youtube', color: '#FF0000', name: 'YouTube Premium', group: 'video', plans: [m('Individuel', 12.99)] },

  // Musique
  { id: 'spotify', color: '#1ED760', name: 'Spotify', group: 'musique', plans: [m('Personnel', 12.14), m('Étudiant', 6.07), m('Duo', 16.99)] },
  { id: 'deezer', color: '#A238FF', name: 'Deezer', group: 'musique', plans: [m('Premium', 12.99), m('Étudiant', 6.49)] },
  { id: 'apple-music', color: '#FA243C', name: 'Apple Music', group: 'musique', plans: [m('Individuel', 10.99), m('Étudiant', 5.99)] },

  // Jeux vidéo
  { id: 'ps-plus', color: '#0070D1', name: 'PlayStation Plus', group: 'jeux', plans: [m('Essential', 8.99), y('Essential annuel', 71.99)] },
  { id: 'game-pass', color: '#107C10', name: 'Xbox Game Pass', group: 'jeux', plans: [m('Ultimate', 17.99)] },
  { id: 'switch-online', color: '#E60012', name: 'Nintendo Switch Online', group: 'jeux', plans: [y('Annuel', 19.99)] },

  // Cloud, téléphone, internet
  { id: 'icloud', color: '#3693F3', name: 'iCloud+', group: 'cloud', keywords: 'apple stockage', plans: [m('50 Go', 0.99), m('200 Go', 2.99), m('2 To', 9.99)] },
  { id: 'google-one', color: '#4285F4', name: 'Google One', group: 'cloud', keywords: 'stockage drive', plans: [m('100 Go', 1.99), m('2 To', 9.99)] },
  { id: 'mobile', color: '#5E5A70', name: 'Forfait mobile', group: 'cloud', keywords: 'free sfr orange bouygues sosh red', plans: [m('Mensuel', 15)] },
  { id: 'box', color: '#5E5A70', name: 'Box internet', group: 'cloud', keywords: 'fibre wifi', plans: [m('Mensuel', 30)] },

  // Transport
  { id: 'navigo', color: '#00A88F', name: 'Navigo', group: 'transport', keywords: 'metro ratp idf', plans: [m('Mois', 90.8), y('Imagine R étudiant', 384)] },
  { id: 'velib', color: '#8DB63C', name: "Vélib'", group: 'transport', keywords: 'velo', plans: [m('V-Max', 8.3)] },
  { id: 'assurance-auto', color: '#5E5A70', name: 'Assurance auto ou moto', group: 'transport', plans: [m('Mensuel', 50)] },

  // Maison et assurances
  { id: 'assurance-habitation', color: '#5E5A70', name: 'Assurance habitation', group: 'maison', plans: [m('Mensuel', 15)] },
  { id: 'mutuelle', color: '#5E5A70', name: 'Mutuelle santé', group: 'maison', plans: [m('Mensuel', 40)] },
  { id: 'electricite', color: '#5E5A70', name: 'Électricité et gaz', group: 'maison', keywords: 'edf engie', plans: [m('Mensuel', 60)] },
  { id: 'rc-pro', color: '#5E5A70', name: 'Assurance RC pro', group: 'maison', pro: true, keywords: 'responsabilite civile', plans: [m('Mensuel', 20)] },
  { id: 'banque-pro', color: '#5E5A70', name: 'Compte bancaire pro', group: 'maison', pro: true, keywords: 'qonto shine banque', plans: [m('Mensuel', 9)] },
]

/** Équivalent mensuel d'un prix (annuel ÷ 12, 4 semaines × 13 ÷ 12). */
export function monthlyPrice(plan: SubscriptionPlan): number {
  if (plan.billing === 'an') return Math.round(plan.price / 12)
  if (plan.billing === '4sem') return Math.round((plan.price * 13) / 12)
  return plan.price
}

export const BILLING_LABEL: Record<Billing, string> = { mois: 'par mois', an: 'par an', '4sem': 'toutes les 4 semaines' }

export function subscriptionById(id: string | undefined): Subscription | undefined {
  return id ? SUBSCRIPTIONS.find((s) => s.id === id) : undefined
}

/** Deux lettres pour la pastille (« Canva Pro » → « CP », « Netflix » → « NE »). */
export function monogram(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, ' ').split(' ').filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0] ?? '?').slice(0, 2).toUpperCase()
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function searchSubscriptions(query: string): Subscription[] {
  const q = fold(query.trim())
  if (!q) return SUBSCRIPTIONS
  return SUBSCRIPTIONS.filter((s) => fold(`${s.name} ${s.keywords ?? ''} ${s.plans.map((p) => p.label).join(' ')}`).includes(q))
}
