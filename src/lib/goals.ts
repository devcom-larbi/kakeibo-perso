import { monthKeyOf, monthLabel } from './dates'
import type { Goal } from './types'

export function savedFor(goal: Goal): number {
  return goal.contributions.reduce((t, c) => t + c.amount, 0)
}

export function remainingFor(goal: Goal): number {
  return Math.max(goal.target - savedFor(goal), 0)
}

export function progressOf(goal: Goal): number {
  if (goal.target <= 0) return 1
  return Math.min(Math.max(savedFor(goal) / goal.target, 0), 1)
}

export function isReached(goal: Goal): boolean {
  return savedFor(goal) >= goal.target && goal.target > 0
}

/** Nombre de mois restants, mois en cours et mois visé compris (0 si la date est passée). */
export function monthsLeft(deadline: string, currentKey: string): number {
  const [dy, dm] = deadline.split('-').map(Number)
  const [cy, cm] = currentKey.split('-').map(Number)
  return Math.max((dy - cy) * 12 + (dm - cm) + 1, 0)
}

/**
 * Ce qu'il faut mettre de côté chaque mois pour arriver à temps (centimes, arrondi à l'euro supérieur),
 * ou null si l'objectif n'a pas de date ou est déjà atteint.
 */
export function monthlyNeeded(goal: Goal, currentKey: string): number | null {
  if (!goal.deadline || goal.doneAt) return null
  const remaining = remainingFor(goal)
  if (remaining === 0) return null
  const months = monthsLeft(goal.deadline, currentKey)
  return months === 0 ? remaining : Math.ceil(remaining / months / 100) * 100
}

export function activeGoals(goals: Goal[]): Goal[] {
  return goals
    .filter((g) => !g.doneAt)
    .sort((a, b) => {
      if (a.deadline && b.deadline && a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1
      if (a.deadline && !b.deadline) return -1
      if (!a.deadline && b.deadline) return 1
      return a.createdAt - b.createdAt
    })
}

export function doneGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.doneAt).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))
}

/** Total mensuel à épargner pour tenir toutes les dates des objectifs en cours. */
export function totalMonthlyNeeded(goals: Goal[], currentKey: string): number {
  return activeGoals(goals).reduce((t, g) => t + (monthlyNeeded(g, currentKey) ?? 0), 0)
}

/** Argent mis de côté pour les objectifs pendant un mois donné. */
export function savedInMonth(goals: Goal[], key: string): number {
  return goals.reduce(
    (t, g) => t + g.contributions.filter((c) => monthKeyOf(c.date) === key).reduce((s, c) => s + c.amount, 0),
    0,
  )
}

/** « avril 2027, dans 5 mois » — ou null sans date. */
export function deadlineText(goal: Goal, nowKey: string): { text: string; late: boolean } | null {
  if (!goal.deadline) return null
  const months = monthsLeft(goal.deadline, nowKey)
  const raw = monthLabel(goal.deadline)
  const label = raw.charAt(0).toUpperCase() + raw.slice(1)
  if (months === 0) return { text: `Date dépassée (${raw})`, late: !isReached(goal) }
  if (months === 1) return { text: `${label}, c'est ce mois-ci`, late: false }
  return { text: `${label}, dans ${months - 1} mois`, late: false }
}
