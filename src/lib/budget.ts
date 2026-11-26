import { daysInMonth, firstDayOfMonth, monthKeyOf, parseISODate, shiftMonth, toISODate } from './dates'
import {
  ACTIVITIES,
  CATEGORY_IDS,
  DEFAULT_PRO,
  emptyPlan,
  type AppData,
  type CategoryId,
  type Expense,
  type LineItem,
  type MonthPlan,
  type ProSettings,
} from './types'

export function sumItems(items: LineItem[]): number {
  return items.reduce((total, item) => total + item.amount, 0)
}

/** Pourcentage total retenu sur le chiffre d'affaires, pour 10 000 (cotisations + impôt libératoire). */
export function proRate(pro: ProSettings | null): number {
  const p = pro ?? DEFAULT_PRO
  const activity = ACTIVITIES.find((a) => a.id === p.activity)
  return p.rate + (p.liberatoire && activity ? activity.liberatoire : 0)
}

/** Ce que l'URSSAF prendra sur une somme encaissée par ton activité. */
export function contributionsOn(amount: number, pro: ProSettings | null): number {
  return Math.round((amount * proRate(pro)) / 10000)
}

export function getPlan(data: AppData, key: string): MonthPlan {
  return data.months[key] ?? emptyPlan()
}

export function hasPlan(data: AppData, key: string): boolean {
  const plan = data.months[key]
  return !!plan && (plan.incomes.length > 0 || plan.fixed.length > 0 || plan.savingsGoal > 0)
}

/** Dépenses du mois, des plus récentes aux plus anciennes. */
export function expensesOfMonth(data: AppData, key: string): Expense[] {
  return data.expenses
    .filter((e) => monthKeyOf(e.date) === key)
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
}

export function totalsByCategory(expenses: Expense[]): Record<CategoryId, number> {
  const totals = Object.fromEntries(CATEGORY_IDS.map((id) => [id, 0])) as Record<CategoryId, number>
  for (const e of expenses) totals[e.category] += e.amount
  return totals
}

export interface MonthSummary {
  income: number
  /** Part des revenus qui vient de ton activité */
  proIncome: number
  /** Cotisations URSSAF (et impôt libératoire) à prévoir sur proIncome */
  contributions: number
  fixed: number
  /** Part des charges fixes liée à ton activité */
  proFixed: number
  savingsGoal: number
  /** Revenus − cotisations − charges fixes − épargne visée */
  available: number
  spent: number
  /** Disponible − dépensé (négatif = dépassement) */
  remaining: number
  /** Revenus − cotisations − charges fixes − dépensé */
  actualSavings: number
  byCategory: Record<CategoryId, number>
}

export function monthSummary(data: AppData, key: string): MonthSummary {
  const plan = getPlan(data, key)
  const expenses = expensesOfMonth(data, key)
  const income = sumItems(plan.incomes)
  const proIncome = sumItems(plan.incomes.filter((i) => i.pro))
  const contributions = contributionsOn(proIncome, data.settings.pro)
  const fixed = sumItems(plan.fixed)
  const proFixed = sumItems(plan.fixed.filter((i) => i.pro))
  const available = income - contributions - fixed - plan.savingsGoal
  const spent = expenses.reduce((t, e) => t + e.amount, 0)
  return {
    income,
    proIncome,
    contributions,
    fixed,
    proFixed,
    savingsGoal: plan.savingsGoal,
    available,
    spent,
    remaining: available - spent,
    actualSavings: income - contributions - fixed - spent,
    byCategory: totalsByCategory(expenses),
  }
}

export interface Week {
  index: number
  start: string
  end: string
  days: number
}

/** Semaines du lundi au dimanche, coupées aux bords du mois. */
export function weeksOfMonth(key: string): Week[] {
  const total = daysInMonth(key)
  const weeks: Week[] = []
  let cursor = parseISODate(firstDayOfMonth(key))
  let dayOfMonth = 1
  while (dayOfMonth <= total) {
    const weekday = (cursor.getDay() + 6) % 7 // lundi = 0
    const days = Math.min(7 - weekday, total - dayOfMonth + 1)
    const start = toISODate(cursor)
    const endDate = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + days - 1)
    weeks.push({ index: weeks.length + 1, start, end: toISODate(endDate), days })
    cursor = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1)
    dayOfMonth += days
  }
  return weeks
}

export interface WeekBudget extends Week {
  /** Part du disponible au prorata du nombre de jours */
  budget: number
  spent: number
}

export function weeklyBreakdown(data: AppData, key: string): WeekBudget[] {
  const { available } = monthSummary(data, key)
  const total = daysInMonth(key)
  const expenses = expensesOfMonth(data, key)
  return weeksOfMonth(key).map((week) => ({
    ...week,
    budget: Math.round((Math.max(available, 0) * week.days) / total),
    spent: expenses.filter((e) => e.date >= week.start && e.date <= week.end).reduce((t, e) => t + e.amount, 0),
  }))
}

/** Copie revenus, charges fixes et épargne visée du mois précédent (nouveaux ids, réflexion vide). */
export function planFromPrevious(data: AppData, key: string): MonthPlan | null {
  const prevKey = shiftMonth(key, -1)
  if (!hasPlan(data, prevKey)) return null
  const prev = getPlan(data, prevKey)
  const copy = (items: LineItem[]) => items.map((item) => ({ ...item, id: `${item.id}-${key}` }))
  return { incomes: copy(prev.incomes), fixed: copy(prev.fixed), savingsGoal: prev.savingsGoal, improve: '' }
}
