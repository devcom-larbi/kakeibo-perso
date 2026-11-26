/** Les 4 piliers du Kakeibo. */
export type CategoryId = 'survie' | 'loisirs' | 'culture' | 'imprevus'

export interface Category {
  id: CategoryId
  label: string
  hint: string
  /** Tampon japonais : 生 la vie, 楽 le plaisir, 文 la culture, 備 la prévoyance */
  kanji: string
}

export const CATEGORIES: Category[] = [
  { id: 'survie', label: 'Survie', hint: 'Courses, transport, santé', kanji: '生' },
  { id: 'loisirs', label: 'Loisirs', hint: 'Restos, sorties, envies', kanji: '楽' },
  { id: 'culture', label: 'Culture', hint: 'Livres, ciné, cours', kanji: '文' },
  { id: 'imprevus', label: 'Imprévus', hint: 'Réparations, cadeaux', kanji: '備' },
]

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id)

export function categoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]
}

/** Montants toujours en centimes (entiers) pour éviter les erreurs d'arrondi. */
export interface Expense {
  id: string
  /** Date locale au format AAAA-MM-JJ */
  date: string
  amount: number
  category: CategoryId
  note: string
  createdAt: number
}

export interface LineItem {
  id: string
  label: string
  amount: number
  /** Revenu ou charge de ton activité (micro-entreprise) */
  pro?: boolean
  /** Abonnement choisi dans le catalogue */
  catalogId?: string
}

/** Type d'activité en micro-entreprise : fixe le pourcentage de cotisations URSSAF. */
export type ActivityId = 'bnc' | 'bic' | 'vente' | 'cipav' | 'perso'

export interface Activity {
  id: ActivityId
  label: string
  hint: string
  /** Cotisations sociales, pour 10 000 (2560 = 25,6 %) */
  rate: number
  /** Versement libératoire de l'impôt sur le revenu, pour 10 000 */
  liberatoire: number
}

/** Taux 2026 indiqués par l'URSSAF et l'Assurance retraite. À vérifier sur urssaf.fr. */
export const ACTIVITIES: Activity[] = [
  { id: 'bnc', label: 'Prestations de services (BNC)', hint: 'Freelance, création, conseil, développement', rate: 2560, liberatoire: 220 },
  { id: 'bic', label: 'Services commerciaux ou artisanaux (BIC)', hint: 'Artisanat, réparation, location meublée', rate: 2120, liberatoire: 170 },
  { id: 'vente', label: 'Vente de marchandises', hint: 'Achat-revente, boutique en ligne', rate: 1230, liberatoire: 100 },
  { id: 'cipav', label: 'Profession libérale (CIPAV)', hint: 'Architecte, psychologue, ostéopathe…', rate: 2320, liberatoire: 220 },
  { id: 'perso', label: 'Autre taux', hint: 'Tu indiques toi-même le pourcentage total', rate: 2200, liberatoire: 0 },
]

export interface ProSettings {
  activity: ActivityId
  /** Taux de cotisations utilisé, pour 10 000 (modifiable pour « Autre taux ») */
  rate: number
  /** Ajoute le versement libératoire de l'impôt */
  liberatoire: boolean
}

export const DEFAULT_PRO: ProSettings = { activity: 'bnc', rate: 2560, liberatoire: false }

export interface Settings {
  /** null tant que l'activité n'a pas été choisie */
  pro: ProSettings | null
  /** Dernier mois dont la révélation du bilan a été vue (AAAA-MM) */
  reviewSeen?: string
}

/** Le budget préparé en début de mois + la réflexion de fin de mois. */
export interface MonthPlan {
  incomes: LineItem[]
  fixed: LineItem[]
  savingsGoal: number
  improve: string
}

/** Types d'objectifs d'épargne. */
export type GoalKind = 'voyage' | 'achat' | 'securite' | 'projet'

export const GOAL_KINDS: { id: GoalKind; label: string; example: string }[] = [
  { id: 'voyage', label: 'Voyage', example: 'Ex. Japon en avril' },
  { id: 'achat', label: 'Achat', example: 'Ex. nouveau vélo' },
  { id: 'securite', label: 'Sécurité', example: 'Ex. 3 mois de dépenses de côté' },
  { id: 'projet', label: 'Projet', example: 'Ex. permis de conduire' },
]

/** Argent mis de côté pour un objectif (négatif = retiré). */
export interface Contribution {
  id: string
  date: string
  amount: number
  note: string
}

export interface Goal {
  id: string
  name: string
  kind: GoalKind
  target: number
  /** Mois visé AAAA-MM, ou null si pas de date */
  deadline: string | null
  contributions: Contribution[]
  /** Date (ms) à laquelle l'objectif a été marqué comme réalisé */
  doneAt: number | null
  createdAt: number
}

export interface AppData {
  version: 1
  expenses: Expense[]
  /** Clé : AAAA-MM */
  months: Record<string, MonthPlan>
  goals: Goal[]
  settings: Settings
}

export function emptyPlan(): MonthPlan {
  return { incomes: [], fixed: [], savingsGoal: 0, improve: '' }
}

export function emptyData(): AppData {
  return { version: 1, expenses: [], months: {}, goals: [], settings: { pro: null } }
}

export function newId(): string {
  // crypto.randomUUID n'existe qu'en HTTPS/localhost : on garde un repli.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
