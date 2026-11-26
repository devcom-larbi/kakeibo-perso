import { describe, expect, it } from 'vitest'
import { activeGoals, monthlyNeeded, monthsLeft, progressOf, savedFor, savedInMonth, totalMonthlyNeeded } from './goals'
import type { Goal } from './types'

const goal = (over: Partial<Goal> = {}): Goal => ({
  id: 'g',
  name: 'Japon',
  kind: 'voyage',
  target: 300000,
  deadline: '2027-04',
  contributions: [
    { id: 'c1', date: '2026-10-05', amount: 50000, note: '' },
    { id: 'c2', date: '2026-11-03', amount: 30000, note: '' },
  ],
  doneAt: null,
  createdAt: 0,
  ...over,
})

describe('objectifs', () => {
  it('additionne ce qui a été mis de côté (retraits compris)', () => {
    expect(savedFor(goal())).toBe(80000)
    const withWithdrawal = goal({ contributions: [...goal().contributions, { id: 'c3', date: '2026-11-10', amount: -10000, note: '' }] })
    expect(savedFor(withWithdrawal)).toBe(70000)
  })

  it('borne la progression entre 0 et 1', () => {
    expect(progressOf(goal())).toBeCloseTo(80000 / 300000)
    expect(progressOf(goal({ target: 50000 }))).toBe(1)
  })

  it('compte les mois restants, mois en cours et mois visé compris', () => {
    expect(monthsLeft('2027-04', '2026-11')).toBe(6)
    expect(monthsLeft('2026-11', '2026-11')).toBe(1)
    expect(monthsLeft('2026-09', '2026-11')).toBe(0)
  })

  it("calcule le montant mensuel nécessaire, arrondi à l'euro supérieur", () => {
    // reste 2 200 € sur 6 mois
    expect(monthlyNeeded(goal(), '2026-11')).toBe(36700)
    expect(monthlyNeeded(goal({ deadline: null }), '2026-11')).toBeNull()
    expect(monthlyNeeded(goal({ target: 80000 }), '2026-11')).toBeNull()
    expect(monthlyNeeded(goal({ deadline: '2026-08' }), '2026-11')).toBe(220000)
  })

  it('trie les objectifs en cours par date, sans date à la fin, et ignore les réalisés', () => {
    const goals = [
      goal({ id: 'sans', deadline: null }),
      goal({ id: 'loin', deadline: '2028-01' }),
      goal({ id: 'fait', doneAt: 1 }),
      goal({ id: 'proche', deadline: '2027-01' }),
    ]
    expect(activeGoals(goals).map((g) => g.id)).toEqual(['proche', 'loin', 'sans'])
  })

  it("additionne l'effort mensuel et l'épargne du mois", () => {
    const goals = [goal(), goal({ id: 'b', deadline: null }), goal({ id: 'c', doneAt: 1 })]
    expect(totalMonthlyNeeded(goals, '2026-11')).toBe(36700)
    expect(savedInMonth(goals, '2026-11')).toBe(90000)
  })
})
