import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  emptyData,
  emptyPlan,
  newId,
  CATEGORY_IDS,
  GOAL_KINDS,
  type AppData,
  type Contribution,
  type Expense,
  type Goal,
  type LineItem,
  type MonthPlan,
} from './lib/types'
import { planFromPrevious } from './lib/budget'

const STORAGE_KEY = 'kakeibo-perso:v1'

function isLineItem(x: unknown): x is LineItem {
  const i = x as LineItem
  return !!i && typeof i.id === 'string' && typeof i.label === 'string' && Number.isFinite(i.amount)
}

/** Vérifie qu'un objet (localStorage ou fichier importé) a bien la forme attendue. */
export function parseAppData(raw: unknown): AppData | null {
  const d = raw as AppData
  if (!d || d.version !== 1 || !Array.isArray(d.expenses) || typeof d.months !== 'object' || d.months === null) {
    return null
  }
  const expenses = d.expenses.filter(
    (e): e is Expense =>
      !!e &&
      typeof e.id === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
      Number.isFinite(e.amount) &&
      CATEGORY_IDS.includes(e.category),
  ).map((e) => ({ ...e, note: typeof e.note === 'string' ? e.note : '', createdAt: Number(e.createdAt) || 0 }))
  const months: Record<string, MonthPlan> = {}
  for (const [key, p] of Object.entries(d.months)) {
    if (!/^\d{4}-\d{2}$/.test(key) || !p) continue
    months[key] = {
      incomes: Array.isArray(p.incomes) ? p.incomes.filter(isLineItem) : [],
      fixed: Array.isArray(p.fixed) ? p.fixed.filter(isLineItem) : [],
      savingsGoal: Number.isFinite(p.savingsGoal) ? p.savingsGoal : 0,
      improve: typeof p.improve === 'string' ? p.improve : '',
    }
  }
  const goals = Array.isArray(d.goals) ? d.goals.flatMap(parseGoal) : []
  return { version: 1, expenses, months, goals }
}

function parseGoal(raw: unknown): Goal[] {
  const g = raw as Goal
  if (!g || typeof g.id !== 'string' || typeof g.name !== 'string' || !Number.isFinite(g.target)) return []
  const contributions = Array.isArray(g.contributions)
    ? g.contributions.filter(
        (c): c is Contribution =>
          !!c && typeof c.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.date) && Number.isFinite(c.amount),
      ).map((c) => ({ ...c, note: typeof c.note === 'string' ? c.note : '' }))
    : []
  return [
    {
      id: g.id,
      name: g.name,
      kind: GOAL_KINDS.some((k) => k.id === g.kind) ? g.kind : 'projet',
      target: g.target,
      deadline: typeof g.deadline === 'string' && /^\d{4}-\d{2}$/.test(g.deadline) ? g.deadline : null,
      contributions,
      doneAt: Number.isFinite(g.doneAt) ? g.doneAt : null,
      createdAt: Number(g.createdAt) || 0,
    },
  ]
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    return parseAppData(JSON.parse(raw)) ?? emptyData()
  } catch {
    return emptyData()
  }
}

interface Store {
  data: AppData
  saveError: boolean
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => void
  updateExpense: (id: string, patch: Omit<Expense, 'id' | 'createdAt'>) => void
  deleteExpense: (id: string) => void
  updatePlan: (key: string, patch: Partial<MonthPlan>) => void
  copyPreviousPlan: (key: string) => boolean
  replaceAll: (data: AppData) => void
  addGoal: (goal: Pick<Goal, 'name' | 'kind' | 'target' | 'deadline'>, initial: Omit<Contribution, 'id'> | null) => void
  updateGoal: (id: string, patch: Partial<Omit<Goal, 'id' | 'contributions'>>) => void
  deleteGoal: (id: string) => void
  addContribution: (goalId: string, c: Omit<Contribution, 'id'>) => void
  deleteContribution: (goalId: string, contributionId: string) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(load)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
  }, [data])

  const addExpense = useCallback<Store['addExpense']>((e) => {
    setData((d) => ({ ...d, expenses: [...d.expenses, { ...e, id: newId(), createdAt: Date.now() }] }))
  }, [])

  const updateExpense = useCallback<Store['updateExpense']>((id, patch) => {
    setData((d) => ({ ...d, expenses: d.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  }, [])

  const deleteExpense = useCallback<Store['deleteExpense']>((id) => {
    setData((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }))
  }, [])

  const updatePlan = useCallback<Store['updatePlan']>((key, patch) => {
    setData((d) => ({ ...d, months: { ...d.months, [key]: { ...(d.months[key] ?? emptyPlan()), ...patch } } }))
  }, [])

  const copyPreviousPlan = useCallback<Store['copyPreviousPlan']>(
    (key) => {
      const plan = planFromPrevious(data, key)
      if (!plan) return false
      setData((d) => ({ ...d, months: { ...d.months, [key]: { ...plan, improve: d.months[key]?.improve ?? '' } } }))
      return true
    },
    [data],
  )

  const replaceAll = useCallback<Store['replaceAll']>((next) => setData(next), [])

  const mapGoal = (id: string, fn: (g: Goal) => Goal) =>
    setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? fn(g) : g)) }))

  const addGoal = useCallback<Store['addGoal']>((goal, initial) => {
    const contributions = initial && initial.amount !== 0 ? [{ ...initial, id: newId() }] : []
    setData((d) => ({
      ...d,
      goals: [...d.goals, { ...goal, id: newId(), contributions, doneAt: null, createdAt: Date.now() }],
    }))
  }, [])

  const updateGoal = useCallback<Store['updateGoal']>((id, patch) => mapGoal(id, (g) => ({ ...g, ...patch })), [])

  const deleteGoal = useCallback<Store['deleteGoal']>((id) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }))
  }, [])

  const addContribution = useCallback<Store['addContribution']>(
    (goalId, c) => mapGoal(goalId, (g) => ({ ...g, contributions: [...g.contributions, { ...c, id: newId() }] })),
    [],
  )

  const deleteContribution = useCallback<Store['deleteContribution']>(
    (goalId, contributionId) =>
      mapGoal(goalId, (g) => ({ ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) })),
    [],
  )

  const value = useMemo(
    () => ({
      data,
      saveError,
      addExpense,
      updateExpense,
      deleteExpense,
      updatePlan,
      copyPreviousPlan,
      replaceAll,
      addGoal,
      updateGoal,
      deleteGoal,
      addContribution,
      deleteContribution,
    }),
    [
      data,
      saveError,
      addExpense,
      updateExpense,
      deleteExpense,
      updatePlan,
      copyPreviousPlan,
      replaceAll,
      addGoal,
      updateGoal,
      deleteGoal,
      addContribution,
      deleteContribution,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return store
}
