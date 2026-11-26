/** Les 4 piliers du Kakeibo. */
export type CategoryId = 'survie' | 'loisirs' | 'culture' | 'imprevus'

export interface Category {
  id: CategoryId
  label: string
  hint: string
}

export const CATEGORIES: Category[] = [
  { id: 'survie', label: 'Survie', hint: 'Courses, transport, santé' },
  { id: 'loisirs', label: 'Loisirs', hint: 'Restos, sorties, envies' },
  { id: 'culture', label: 'Culture', hint: 'Livres, ciné, cours' },
  { id: 'imprevus', label: 'Imprévus', hint: 'Réparations, cadeaux' },
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
}

/** Le budget préparé en début de mois + la réflexion de fin de mois. */
export interface MonthPlan {
  incomes: LineItem[]
  fixed: LineItem[]
  savingsGoal: number
  improve: string
}

export interface AppData {
  version: 1
  expenses: Expense[]
  /** Clé : AAAA-MM */
  months: Record<string, MonthPlan>
}

export function emptyPlan(): MonthPlan {
  return { incomes: [], fixed: [], savingsGoal: 0, improve: '' }
}

export function emptyData(): AppData {
  return { version: 1, expenses: [], months: {} }
}

export function newId(): string {
  // crypto.randomUUID n'existe qu'en HTTPS/localhost : on garde un repli.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}
