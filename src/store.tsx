import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { emptyData, emptyPlan, newId, CATEGORY_IDS, type AppData, type Expense, type LineItem, type MonthPlan } from './lib/types'
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
  return { version: 1, expenses, months }
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

  const value = useMemo(
    () => ({ data, saveError, addExpense, updateExpense, deleteExpense, updatePlan, copyPreviousPlan, replaceAll }),
    [data, saveError, addExpense, updateExpense, deleteExpense, updatePlan, copyPreviousPlan, replaceAll],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore doit être utilisé dans <StoreProvider>')
  return store
}
