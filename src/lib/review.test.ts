import { describe, expect, it } from 'vitest'
import { rankOf, reviewMonth } from './review'
import type { AppData, Expense } from './types'

const e = (date: string, amount: number, category: Expense['category'] = 'survie', note = ''): Expense => ({
  id: date + amount + category,
  date,
  amount,
  category,
  note,
  createdAt: 0,
})

const base: AppData = {
  version: 1,
  goals: [],
  settings: { pro: null },
  months: {
    '2026-10': { incomes: [{ id: 'a', label: 'Salaire', amount: 200000 }], fixed: [{ id: 'b', label: 'Loyer', amount: 70000 }], savingsGoal: 30000, improve: '' },
    '2026-11': {
      incomes: [{ id: 'a', label: 'Salaire', amount: 200000 }],
      fixed: [
        { id: 'b', label: 'Loyer', amount: 70000 },
        { id: 'c', label: 'Netflix', amount: 1499, catalogId: 'netflix' },
      ],
      savingsGoal: 30000,
      improve: '',
    },
  },
  expenses: [
    e('2026-10-05', 20000, 'loisirs'),
    e('2026-10-12', 30000, 'survie'),
    e('2026-11-03', 45000, 'loisirs', 'Concert'),
    e('2026-11-10', 20000, 'survie'),
  ],
}

describe('rang du mois', () => {
  it('donne S quand il reste au moins 15 % du disponible', () => {
    expect(rankOf(100000, 80000, 50000)).toBe('S')
    expect(rankOf(100000, 95000, 35000)).toBe('A')
    expect(rankOf(100000, 105000, 25000)).toBe('B')
    expect(rankOf(100000, 130000, 1000)).toBe('C')
    expect(rankOf(100000, 200000, -5000)).toBe('D')
  })
})

describe('bilan automatique', () => {
  it('analyse un mois terminé', () => {
    const r = reviewMonth(base, '2026-11', '2026-12-02')
    expect(r.status).toBe('done')
    // disponible 985,01 € − dépensé 650 € = 335,01 € de marge (34 %) → S
    expect(r.rank).toBe('S')
    expect(r.insights[0]).toMatchObject({ kind: 'save', tone: 'good' })
    const up = r.insights.find((i) => i.kind === 'up')
    expect(up?.label).toBe('Loisirs en hausse')
    expect(r.insights.find((i) => i.kind === 'big')?.detail).toContain('Concert')
    expect(r.insights.find((i) => i.kind === 'subs')?.value).toContain('14,99')
    expect(r.tips[0]).toMatch(/Vise 200\s€ en loisirs/)
  })

  it('projette le mois en cours au rythme actuel', () => {
    // le 10 novembre : 650 € dépensés en 10 jours → 1 950 € projetés sur 30 jours
    const r = reviewMonth(base, '2026-11', '2026-11-10')
    expect(r.status).toBe('live')
    expect(r.spentRef).toBe(195000)
    expect(r.rank).toBe('D')
    expect(r.tips.some((t) => t.includes('par jour'))).toBe(true)
  })

  it('ne donne pas de rang trop tôt dans le mois', () => {
    expect(reviewMonth(base, '2026-11', '2026-11-02').rank).toBeNull()
  })

  it('ne dit rien sur un mois vide ou futur', () => {
    expect(reviewMonth(base, '2026-09', '2026-11-10').status).toBe('empty')
    expect(reviewMonth(base, '2026-12', '2026-11-10').status).toBe('empty')
  })
})
