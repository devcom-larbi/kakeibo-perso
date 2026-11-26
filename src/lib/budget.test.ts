import { describe, expect, it } from 'vitest'
import { contributionsOn, monthSummary, planFromPrevious, proRate, weeklyBreakdown, weeksOfMonth } from './budget'
import { parseMoney } from './money'
import { ofMonth } from './dates'
import type { AppData, Expense } from './types'

const expense = (date: string, amount: number, category: Expense['category'] = 'survie'): Expense => ({
  id: date + amount,
  date,
  amount,
  category,
  note: '',
  createdAt: 0,
})

const data: AppData = {
  version: 1,
  goals: [],
  settings: { pro: null },
  months: {
    '2026-11': {
      incomes: [{ id: 'a', label: 'Salaire', amount: 210000 }],
      fixed: [{ id: 'b', label: 'Loyer', amount: 65000 }, { id: 'c', label: 'Internet', amount: 3000 }],
      savingsGoal: 20000,
      improve: '',
    },
  },
  expenses: [
    expense('2026-11-02', 4550),
    expense('2026-11-03', 1200, 'loisirs'),
    expense('2026-11-30', 2000, 'culture'),
    expense('2026-10-31', 9999),
  ],
}

describe('monthSummary', () => {
  it('applique la formule Kakeibo : revenus − fixes − épargne − dépenses', () => {
    const s = monthSummary(data, '2026-11')
    expect(s.available).toBe(122000)
    expect(s.spent).toBe(7750)
    expect(s.remaining).toBe(114250)
    expect(s.actualSavings).toBe(134250)
    expect(s.byCategory).toEqual({ survie: 4550, loisirs: 1200, culture: 2000, imprevus: 0 })
  })

  it('renvoie des zéros pour un mois sans budget', () => {
    const s = monthSummary(data, '2026-12')
    expect(s.available).toBe(0)
    expect(s.spent).toBe(0)
  })
})

describe('weeksOfMonth', () => {
  it('découpe novembre 2026 (commence un dimanche) en semaines lundi-dimanche', () => {
    const weeks = weeksOfMonth('2026-11')
    expect(weeks.map((w) => [w.start, w.end, w.days])).toEqual([
      ['2026-11-01', '2026-11-01', 1],
      ['2026-11-02', '2026-11-08', 7],
      ['2026-11-09', '2026-11-15', 7],
      ['2026-11-16', '2026-11-22', 7],
      ['2026-11-23', '2026-11-29', 7],
      ['2026-11-30', '2026-11-30', 1],
    ])
  })

  it('couvre tous les jours du mois', () => {
    for (const key of ['2026-02', '2028-02', '2026-03', '2026-12']) {
      const total = weeksOfMonth(key).reduce((t, w) => t + w.days, 0)
      expect(total).toBe(new Date(Number(key.slice(0, 4)), Number(key.slice(5)), 0).getDate())
    }
  })
})

describe('weeklyBreakdown', () => {
  it('répartit le disponible au prorata des jours et range les dépenses par semaine', () => {
    const weeks = weeklyBreakdown(data, '2026-11')
    expect(weeks[1].budget).toBe(Math.round((122000 * 7) / 30))
    expect(weeks[1].spent).toBe(5750)
    expect(weeks[5].spent).toBe(2000)
  })
})

describe('planFromPrevious', () => {
  it('reprend le budget du mois précédent', () => {
    const plan = planFromPrevious(data, '2026-12')
    expect(plan?.incomes[0].amount).toBe(210000)
    expect(plan?.savingsGoal).toBe(20000)
    expect(plan?.incomes[0].id).not.toBe('a')
  })

  it('renvoie null sans budget précédent', () => {
    expect(planFromPrevious(data, '2026-11')).toBeNull()
  })
})

describe('parseMoney', () => {
  it.each([
    ['12', 1200],
    ['12,5', 1250],
    ['12.50', 1250],
    ['1 200,00 €', 120000],
    ['0,1', 10],
  ])('« %s » → %i centimes', (input, cents) => {
    expect(parseMoney(input)).toBe(cents)
  })

  it.each(['', 'abc', '12,5,3', '.'])('refuse « %s »', (input) => {
    expect(parseMoney(input)).toBeNull()
  })
})

describe('ofMonth', () => {
  it('élide devant une voyelle', () => {
    expect(ofMonth('2026-10')).toBe("d'octobre")
    expect(ofMonth('2026-11')).toBe('de novembre')
    expect(ofMonth('2026-04')).toBe("d'avril")
  })
})

describe('activité pro (micro-entreprise)', () => {
  const pro: AppData = {
    ...data,
    settings: { pro: { activity: 'bic', rate: 2120, liberatoire: false } },
    months: {
      '2026-11': {
        incomes: [
          { id: 'a', label: 'Salaire', amount: 150000 },
          { id: 'p', label: 'Mission logo', amount: 3000, pro: true },
          { id: 'q', label: 'Site vitrine', amount: 80000, pro: true },
        ],
        fixed: [
          { id: 'b', label: 'Loyer', amount: 65000 },
          { id: 'c', label: 'Canva Pro', amount: 1199, pro: true, catalogId: 'canva' },
        ],
        savingsGoal: 10000,
        improve: '',
      },
    },
  }

  it('calcule ce que tu devras sur 30 € encaissés', () => {
    expect(contributionsOn(3000, pro.settings.pro)).toBe(636) // 21,2 %
  })

  it('ajoute le versement libératoire quand il est coché', () => {
    expect(proRate({ activity: 'bnc', rate: 2560, liberatoire: true })).toBe(2780)
    expect(proRate({ activity: 'perso', rate: 1800, liberatoire: true })).toBe(1800)
  })

  it('utilise le taux BNC tant que l’activité n’est pas choisie', () => {
    expect(contributionsOn(10000, null)).toBe(2560)
  })

  it('retire les cotisations du disponible du mois', () => {
    const s = monthSummary(pro, '2026-11')
    expect(s.income).toBe(233000)
    expect(s.proIncome).toBe(83000)
    expect(s.contributions).toBe(17596) // 21,2 % de 830 €
    expect(s.proFixed).toBe(1199)
    // 2 330 − 175,96 − 661,99 − 100 = 1 392,05 €
    expect(s.available).toBe(139205)
  })

  it('garde le marquage pro en reprenant le mois précédent', () => {
    const plan = planFromPrevious(pro, '2026-12')
    expect(plan?.incomes.filter((i) => i.pro)).toHaveLength(2)
    expect(plan?.fixed[1].catalogId).toBe('canva')
  })
})
